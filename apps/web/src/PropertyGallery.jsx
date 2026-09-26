import { useState } from "react";
import { ArrowLeft, ArrowRight, Images, Expand } from "lucide-react";
import { Modal, Photo } from "./ui.jsx";

export default function PropertyGallery({ property }) {
  const [opened, setOpened] = useState(false);
  const [index, setIndex] = useState(0);
  const images = property.images;
  const current = Math.min(index, Math.max(0, images.length - 1));
  const move = (direction) =>
    setIndex((current + direction + images.length) % images.length);
  function open(i) {
    setIndex(i);
    setOpened(true);
  }
  if (!images.length)
    return (
      <div className="gallery-empty">
        <Photo alt={property.name} />
        <p>El anfitrión todavía no agregó fotos.</p>
      </div>
    );
  return (
    <>
      <section
        className={`property-gallery gallery-count-${Math.min(3, images.length)}`}
        aria-label={`Fotos de ${property.name}`}
      >
        {images.slice(0, 3).map((image, i) => (
          <button
            className={i === 0 ? "gallery-cover" : "gallery-preview"}
            key={image.id || image.url}
            aria-label={
              i === 0
                ? `Ver todas las fotos de ${property.name}`
                : `Ampliar foto ${i + 1} de ${property.name}`
            }
            onClick={() => open(i)}
          >
            <Photo
              src={image.url}
              alt={image.alt || `${property.name}, foto ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
            />
            {i === 0 && (
              <span className="gallery-open">
                <Images size={17} /> {images.length}{" "}
                {images.length === 1 ? "foto" : "fotos"}
                <Expand size={16} />
              </span>
            )}
          </button>
        ))}
      </section>
      {opened && (
        <Modal
          title={`Fotos de ${property.name}`}
          onClose={() => setOpened(false)}
        >
          <div
            className="gallery-viewer"
            onKeyDown={(event) => {
              if (
                images.length < 2 ||
                !["ArrowLeft", "ArrowRight"].includes(event.key)
              )
                return;
              event.preventDefault();
              move(event.key === "ArrowLeft" ? -1 : 1);
            }}
          >
            <Photo
              src={images[current]?.url}
              alt={
                images[current]?.alt || `${property.name}, foto ${current + 1}`
              }
              className="gallery-full-image"
            />
            <div className="gallery-navigation">
              <button
                className="icon-button outlined"
                aria-label="Foto anterior"
                onClick={() => move(-1)}
                disabled={images.length < 2}
              >
                <ArrowLeft />
              </button>
              <span role="status">
                Foto {current + 1} de {images.length}
              </span>
              <button
                className="icon-button outlined"
                aria-label="Foto siguiente"
                onClick={() => move(1)}
                disabled={images.length < 2}
              >
                <ArrowRight />
              </button>
            </div>
            {images.length > 1 && (
              <div
                className="gallery-thumbs"
                role="group"
                aria-label="Elegir foto"
              >
                {images.map((image, i) => (
                  <button
                    key={image.id || image.url}
                    aria-label={`Ver foto ${i + 1}`}
                    aria-pressed={i === current}
                    onClick={() => setIndex(i)}
                  >
                    <Photo src={image.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
