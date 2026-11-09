import { CalendarCheck, KeyRound, Search, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import "./help.css";

const steps = [
  {
    icon: Search,
    title: "Encontrá tu espacio",
    copy: "Elegí la ciudad, la fecha, el horario, la cantidad de personas y tu presupuesto. También podés filtrar por tipo y comodidades.",
  },
  {
    icon: CalendarCheck,
    title: "Consultá y reservá",
    copy: "Abrí una propiedad para consultar la disponibilidad y el precio de tu horario antes de confirmar la reserva.",
  },
  {
    icon: KeyRound,
    title: "Prepará tu llegada",
    copy: "Cuando la reserva queda confirmada, encontrá el estado, las condiciones y los datos habilitados desde tu cuenta.",
  },
];

export default function Help() {
  return (
    <main className="page help-page" id="ayuda">
      <header className="help-heading">
        <span className="eyebrow">AYUDA</span>
        <h1>Cómo funciona pyApy</h1>
        <p>
          Buscá un lugar, confirmá las condiciones de tu escapada y gestioná la
          reserva desde una sola cuenta.
        </p>
      </header>

      <section className="help-steps" aria-label="Pasos para reservar">
        {steps.map(({ icon: Icon, title, copy }, index) => (
          <article key={title}>
            <span className="help-step-number">{index + 1}</span>
            <Icon size={30} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="help-faq" aria-labelledby="help-faq-title">
        <h2 id="help-faq-title">Antes de confirmar</h2>
        {[
          [
            "¿Cómo se calcula el precio?",
            "La tarifa es por hora iniciada. Al consultar disponibilidad verás la duración, el total y las condiciones. El precio se vuelve a comprobar al confirmar.",
          ],
          [
            "¿Necesito una cuenta para reservar?",
            "Podés explorar sin ingresar. Para continuar con una reserva necesitás una cuenta; tu fecha, horario y personas se conservan al ingresar. Después tenés que consultar y confirmar.",
          ],
          [
            "¿Dónde encuentro la dirección de llegada?",
            "La ficha pública muestra una ubicación aproximada. Los datos de llegada habilitados están en Mis reservas, para la persona autorizada.",
          ],
          [
            "¿Puedo cancelar una reserva?",
            "Cada espacio tiene una política de cancelación. Revisala antes de confirmar. Desde Mis reservas podés solicitar la cancelación cuando las condiciones de tu reserva lo permitan.",
          ],
        ].map(([question, answer]) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </section>

      <section className="help-details" aria-labelledby="help-details-title">
        <div>
          <ShieldCheck size={34} aria-hidden="true" />
          <div>
            <h2 id="help-details-title">Precio, privacidad y cancelaciones</h2>
            <p>
              El precio final se calcula con el horario elegido. La política de
              cancelación pertenece a cada propiedad y se muestra antes de
              confirmar. Los datos privados de llegada solo se habilitan para la
              persona autorizada cuando corresponde.
            </p>
          </div>
        </div>
        <div className="help-actions">
          <Link className="primary" to="/?sort=match#results">
            Explorar espacios
          </Link>
          <Link className="secondary" to="/cuenta">
            Ir a mi cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}
