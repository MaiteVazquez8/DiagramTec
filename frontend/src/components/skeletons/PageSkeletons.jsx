import Skeleton, { SkeletonCircle, SkeletonText } from '../Skeleton.jsx';

function SectorHeroSkeleton({ withToolbar = true }) {
  return (
    <header className="figma-sector-hero skeleton-sector-hero">
      <Skeleton className="skeleton-sector-hero__title" />
      {withToolbar ? (
        <div className="figma-sector-toolbar skeleton-sector-hero__toolbar">
          <Skeleton className="skeleton-btn skeleton-btn--round" />
          <Skeleton className="skeleton-btn skeleton-btn--primary" />
        </div>
      ) : null}
    </header>
  );
}

export function FigmaCardSkeleton({ compact = true }) {
  return (
    <article className={`figma-card skeleton-card${compact ? ' figma-card--compact' : ''}`}>
      <Skeleton className="skeleton-card__media" />
      <div className="figma-card-foot skeleton-card__foot">
        <SkeletonText width="72%" height="0.9rem" />
        {compact ? <Skeleton className="skeleton-card__menu" /> : null}
      </div>
    </article>
  );
}

export function CardsGridSkeleton({ count = 6, className = 'figma-cards-grid' }) {
  return (
    <div className={`${className} skeleton-cards-grid`} aria-busy="true" aria-label="Cargando contenido">
      {Array.from({ length: count }, (_, i) => (
        <FigmaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RouteGuardSkeleton() {
  return (
    <div className="page-container skeleton-route" aria-busy="true" aria-label="Cargando sesión">
      <Skeleton className="skeleton-route__block" />
      <Skeleton className="skeleton-route__block skeleton-route__block--short" />
    </div>
  );
}

export function DesignsPageSkeleton() {
  return (
    <>
      <SectorHeroSkeleton />
      <CardsGridSkeleton count={6} />
    </>
  );
}

export function ClassesPageSkeleton({ teacher = false }) {
  return (
    <div className={teacher ? 'figma-cards-grid figma-classes-grid skeleton-cards-grid' : 'class-list-grid skeleton-cards-grid'} aria-busy="true" aria-label="Cargando clases">
      {Array.from({ length: teacher ? 4 : 3 }, (_, i) => (
        <FigmaCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ClassBannerSkeleton() {
  return (
    <article className="class-detail-banner skeleton-class-banner figma-dot-pattern">
      <Skeleton className="skeleton-class-banner__bookmark" />
      <div className="class-detail-banner__foot skeleton-class-banner__foot">
        <div className="class-detail-banner__info">
          <SkeletonText width="min(280px, 70%)" height="1.75rem" />
          <SkeletonText width="min(180px, 45%)" height="0.95rem" />
        </div>
        <Skeleton className="skeleton-class-banner__code" />
      </div>
    </article>
  );
}

export function ClassPostSkeleton() {
  return (
    <article className="skeleton-class-post">
      <div className="skeleton-class-post__head">
        <SkeletonCircle size={40} />
        <div className="skeleton-class-post__meta">
          <SkeletonText width="120px" height="0.85rem" />
          <SkeletonText width="80px" height="0.7rem" />
        </div>
      </div>
      <Skeleton className="skeleton-class-post__body" />
    </article>
  );
}

export function ClassDetailSkeleton() {
  return (
    <section className="figma-sector class-detail-sector" aria-busy="true" aria-label="Cargando clase">
      <div className="figma-sector-inner">
        <ClassBannerSkeleton />
        <div className="skeleton-class-section-head">
          <SkeletonText width="220px" height="1.35rem" />
          <Skeleton className="skeleton-icon-btn" />
        </div>
        <Skeleton className="skeleton-rule" />
        <Skeleton className="skeleton-upload-trigger" />
        <div className="skeleton-class-posts">
          {Array.from({ length: 2 }, (_, i) => (
            <ClassPostSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ClassMembersSkeleton() {
  return (
    <section className="figma-sector class-detail-sector class-members-sector" aria-busy="true" aria-label="Cargando miembros">
      <div className="figma-sector-inner">
        <ClassBannerSkeleton />
        <div className="skeleton-class-section-head">
          <SkeletonText width="240px" height="1.35rem" />
          <Skeleton className="skeleton-icon-btn" />
        </div>
        <Skeleton className="skeleton-rule" />
        <ul className="skeleton-members-list">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="skeleton-members-row">
              <SkeletonCircle size={44} />
              <SkeletonText width="min(200px, 55%)" height="0.95rem" />
              <Skeleton className="skeleton-members-row__action" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function SuperAdminDashboardSkeleton() {
  return (
    <main className="superadmin-dashboard__main skeleton-superadmin-dashboard" aria-busy="true" aria-label="Cargando panel">
      {Array.from({ length: 3 }, (_, section) => (
        <section key={section} className="superadmin-row skeleton-superadmin-row">
          <div className="superadmin-row__head">
            <SkeletonText width="120px" height="1.25rem" />
            <SkeletonText width="72px" height="0.85rem" />
          </div>
          <div className="superadmin-cards-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="superadmin-tile skeleton-superadmin-tile">
                <Skeleton className="skeleton-superadmin-tile__media" />
                <SkeletonText width="80%" height="0.75rem" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export function SuperAdminManageSkeleton({ rows = 6 }) {
  return (
    <div className="skeleton-superadmin-manage" aria-busy="true" aria-label="Cargando listado">
      <div className="superadmin-manage__row superadmin-manage__row--head skeleton-superadmin-manage__head">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="skeleton-superadmin-manage__col" />
        ))}
      </div>
      <div className="superadmin-manage__list">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="superadmin-manage__row skeleton-superadmin-manage__row">
            <SkeletonCircle size={36} />
            <SkeletonText />
            <SkeletonText />
            <SkeletonText />
            <SkeletonText width="60%" />
            <Skeleton className="skeleton-superadmin-manage__btn" />
            <Skeleton className="skeleton-superadmin-manage__btn skeleton-superadmin-manage__btn--danger" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminClassesManageSkeleton({ rows = 5 }) {
  return (
    <div className="skeleton-superadmin-manage skeleton-superadmin-manage--classes" aria-busy="true" aria-label="Cargando clases">
      <div className="superadmin-class-row superadmin-class-row--head skeleton-superadmin-manage__head">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="skeleton-superadmin-manage__col" />
        ))}
      </div>
      <div className="superadmin-manage__list">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="superadmin-class-row skeleton-superadmin-class-row">
            <SkeletonText />
            <SkeletonText />
            <SkeletonText width="70%" />
            <SkeletonText width="40%" />
            <Skeleton className="skeleton-superadmin-manage__btn skeleton-superadmin-manage__btn--danger" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccountPageSkeleton() {
  return (
    <div className="figma-sector-inner account-layout skeleton-account" aria-busy="true" aria-label="Cargando cuenta">
      <aside className="account-sidebar skeleton-account__sidebar">
        <div className="account-sidebar__body">
          <SkeletonCircle size={88} className="skeleton-account__avatar" />
          <div className="skeleton-account__profile-text">
            <SkeletonText width="140px" height="1.1rem" />
            <SkeletonText width="180px" height="0.85rem" />
            <SkeletonText width="90px" height="0.8rem" />
          </div>
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="skeleton-account__action" />
        ))}
      </aside>
      <main className="account-main">
        {Array.from({ length: 2 }, (_, section) => (
          <section key={section} className="account-section">
            <header className="account-section-head">
              <SkeletonText width="140px" height="1.35rem" />
              <SkeletonText width="72px" height="0.85rem" />
            </header>
            <div className="account-cards-row">
              {Array.from({ length: 5 }, (_, i) => (
                <FigmaCardSkeleton key={i} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
