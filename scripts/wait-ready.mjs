for (let attempt = 0; attempt < 60; attempt++) {
  try {
    const api = await fetch("http://127.0.0.1:4100/api/health");
    const web = await fetch("http://127.0.0.1:5173");
    if (api.ok && web.ok) {
      console.log("API y web disponibles.");
      process.exit(0);
    }
  } catch {
    /* servers may still be starting */
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
throw new Error("Los servidores no respondieron a tiempo.");
