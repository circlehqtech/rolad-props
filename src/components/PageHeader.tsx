import type { ReactNode } from "react";
import FlatIcon from "./FlatIcon";

interface PageHeaderProps {
  title: string;
  description: string;
  section?: string;
  actions?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  section = "Dashboard",
  actions,
}: PageHeaderProps) {
  return (
    <header className="property-page-header page-heading">
      <div className="min-w-0">
        <div className="page-breadcrumb" aria-label="Breadcrumb">
          <FlatIcon name="home" className="text-[12px]" />
          <span>Home</span>
          <FlatIcon name="angle-small-right" className="text-[11px]" />
          <span aria-current="page">{section}</span>
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </header>
  );
}
