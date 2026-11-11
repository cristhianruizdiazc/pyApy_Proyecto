import { CircleHelp } from "lucide-react";
import { Link } from "react-router-dom";
import "./help.css";

export default function Help() {
  return (
    <main className="page help-page" id="ayuda">
      <header className="help-heading">
        <span className="eyebrow">AYUDA</span>
        <h1>Preguntas frecuentes</h1>
        <p>
          Resolvé tus dudas sobre precios, cuentas y reservas para organizar tu
          próxima escapada.
        </p>
      </header>

      <section className="help-faq" aria-labelledby="help-faq-title">
        <h2 id="help-faq-title">Sobre tu reserva</h2>
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
            "¿Qué pasa después de reservar?",
            "Cuando tu reserva queda confirmada, podés consultar su estado, las condiciones y los datos de llegada habilitados desde Mis reservas en tu cuenta.",
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
          <CircleHelp size={34} aria-hidden="true" />
          <div>
            <h2 id="help-details-title">¿Buscás el paso a paso?</h2>
            <p>Conocé cómo encontrar tu espacio y reservarlo en tres pasos.</p>
          </div>
        </div>
        <div className="help-actions">
          <Link className="primary" to="/#como-funciona">
            Ver cómo funciona
          </Link>
          <Link className="secondary" to="/?sort=match#results">
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
