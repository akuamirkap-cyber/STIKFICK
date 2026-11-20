import './office.css';
import type { ReactNode } from 'react';

export type OfficeMenuItem = {
  id: string;
  label: string;
  sub: string;
  disabled?: boolean;
  run: () => void;
};

export function OfficeTitleMenu({ items, active, onSelect, record, label = 'Menu mode side view', className = '' }: {
  items: OfficeMenuItem[];
  active: number;
  onSelect: (index: number) => void;
  record: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <div className={`of-overlay of-title ${className}`} onPointerDown={(event) => event.stopPropagation()}>
      <div className="of-logo pixel">
        <h1 className="of-logo__main of-logo__main--one">STICKBRAWL</h1>
      </div>
      <nav className="of-menu" aria-label={label}>
        {items.map((item, index) => (
          <button key={item.id} type="button" disabled={item.disabled} data-office-menu-item={item.id}
            className={`of-item pixel ${active === index ? 'is-on' : ''}`}
            style={{ animationDelay: `${0.12 + index * 0.055}s` }}
            onPointerEnter={() => { if (!item.disabled) onSelect(index); }} onFocus={() => onSelect(index)}
            onClick={item.run}>
            <span className="of-caret" aria-hidden="true">{active === index ? '>' : ''}</span>
            <span className="of-item__label">{item.label}</span>
            <span className="of-item__sub">{item.sub}</span>
          </button>
        ))}
        {record}
      </nav>
    </div>
  );
}