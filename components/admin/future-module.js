export function FutureModule({ eyebrow, title, description, entities = [], views = [], requirements = [] }) {
  return (
    <div className="admin-stack">
      <section className="admin-card admin-future-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </section>

      <div className="admin-future-grid">
        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Dados esperados do SegurosX</h2>
            <span>Fonte principal</span>
          </div>
          <ul>
            {entities.map((item) => (
              <li key={item}><span>{item}</span></li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Telas previstas</h2>
            <span>Portal autenticado</span>
          </div>
          <ul>
            {views.map((item) => (
              <li key={item}><span>{item}</span></li>
            ))}
          </ul>
        </section>

        <section className="admin-card">
          <div className="admin-card-head">
            <h2>Pré-requisitos</h2>
            <span>Integração</span>
          </div>
          <ul>
            {requirements.map((item) => (
              <li key={item}><span>{item}</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
