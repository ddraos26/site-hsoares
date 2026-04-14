'use client';

export function AdminGuidePanel({
  eyebrow = 'Modo guiado',
  title,
  description,
  steps = [],
  tone = 'blue',
  children
}) {
  return (
    <section className={`admin-guide-card admin-guide-card--${tone}`}>
      <div className="admin-guide-head">
        <div>
          <span>{eyebrow}</span>
          <h3>{title}</h3>
        </div>
      </div>

      {description ? <p className="admin-guide-description">{description}</p> : null}

      <div className="admin-guide-steps">
        {steps.map((step, index) => (
          <div key={`${index + 1}-${step.title}`} className="admin-guide-step">
            <b>{index + 1}</b>
            <div>
              <strong>{step.title}</strong>
              <p>{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {children ? <div className="admin-guide-actions">{children}</div> : null}
    </section>
  );
}
