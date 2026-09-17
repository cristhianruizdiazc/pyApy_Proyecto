import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pool, transaction } from "./db.mjs";
import { config, root } from "./config.mjs";
import { hashPassword } from "./auth.mjs";
if (!config.demo || config.production)
  throw new Error(
    "Fixtures permitidos solamente con DEMO_MODE=true fuera de produccion.",
  );
try {
  const present = (
    await pool.query(
      "SELECT 1 FROM users WHERE email='owner@demo.pyapy.invalid'",
    )
  ).rowCount;
  if (present) {
    console.log("Fixtures ya presentes; no se modificaron datos.");
  } else {
    const credentials = {};
    await transaction(async (db) => {
      let owner;
      for (const role of ["owner", "client", "admin"]) {
        const email = `${role}@demo.pyapy.invalid`,
          password = randomBytes(18).toString("base64url");
        const user = (
          await db.query(
            "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
            [email, `Cuenta demo ${role}`, await hashPassword(password), role],
          )
        ).rows[0];
        credentials[role] = { email, password };
        if (role === "owner") owner = user.id;
      }
      await db.query(
        "INSERT INTO owner_profiles(user_id,commercial_name) VALUES($1,$2)",
        [owner, "Espacios de demostracion"],
      );
      const cities = (
        await db.query("SELECT * FROM geographic_locations ORDER BY city")
      ).rows;
      const fixtures = [
        [
          "Quinta Yvytu",
          "San Bernardino",
          "Quinta",
          25,
          65000,
          "pool,grill,parking,pets",
          "pool",
        ],
        [
          "Casa del Lago",
          "Aregua",
          "Casa",
          12,
          85000,
          "pool,wifi,kitchen,air",
          "house",
        ],
        [
          "El Patio de Altos",
          "Altos",
          "Quincho",
          40,
          50000,
          "grill,parking,accessible",
          "garden",
        ],
        [
          "Bungalow Arami",
          "Caacupe",
          "Bungalow",
          6,
          45000,
          "wifi,kitchen,pets",
          "cabin",
        ],
        [
          "Quinta Las Palmeras",
          "Luque",
          "Quinta",
          30,
          75000,
          "pool,grill,parking,wifi",
          "palms",
        ],
        [
          "Refugio de Pirayu",
          "Pirayu",
          "Casa",
          10,
          55000,
          "pool,grill,kitchen",
          "retreat",
        ],
      ];
      for (const [
        name,
        city,
        kind,
        capacity,
        price,
        amenities,
        image,
      ] of fixtures) {
        const location = cities.find((c) => c.city === city);
        const p = (
          await db.query(
            "INSERT INTO properties(owner_id,city_id,name,description,zone,kind,capacity,latitude,longitude,rules,status,is_demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'published',true) RETURNING id",
            [
              owner,
              location.id,
              name,
              `${name} es un espacio ficticio de demostracion en ${city}. Un lugar para compartir al aire libre, descansar y disfrutar una escapada con tu gente. Las fotografias son ilustrativas y no corresponden a una propiedad comercial verificada.`,
              "Alrededores del centro",
              kind,
              capacity,
              location.latitude,
              location.longitude,
              "Respetar la capacidad maxima. Cuidar los espacios comunes. Consultar antes de organizar eventos.",
            ],
          )
        ).rows[0];
        await db.query(
          "INSERT INTO pricing_rules(property_id,price_per_hour) VALUES($1,$2)",
          [p.id, price],
        );
        await db.query(
          "INSERT INTO availability_rules(property_id,min_hours,max_hours) VALUES($1,4,48)",
          [p.id],
        );
        await db.query(
          "INSERT INTO property_images(property_id,path,alt) VALUES($1,$2,$3)",
          [
            p.id,
            `/demo/${image}.jpg`,
            `Fotografia ilustrativa de ${kind.toLowerCase()}`,
          ],
        );
        for (const amenity of amenities.split(","))
          await db.query(
            "INSERT INTO property_amenities(property_id,amenity_code) VALUES($1,$2)",
            [p.id, amenity],
          );
      }
    });
    await mkdir(resolve(root, ".local"), { recursive: true });
    await writeFile(
      resolve(root, ".local/demo-accounts.json"),
      JSON.stringify(credentials, null, 2),
      { mode: 0o600, flag: "wx" },
    );
    console.log(
      "6 propiedades ficticias creadas. Credenciales aleatorias en .local/demo-accounts.json (fuera de Git).",
    );
  }
} finally {
  await pool.end();
}
