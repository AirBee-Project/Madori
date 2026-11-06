import { IconChevronDown } from "@tabler/icons-react";
import type { HTMLAttributes, ReactNode } from "react";
import styles from "./Panel.module.scss";

export type PanelProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  title: ReactNode;
  footer?: ReactNode;
  /** 指定すると見出しの右端に、本文を畳むボタンを出す */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
};

/**
 * 見出し、スクロールする一覧、フッターを持つパネル。位置は呼び出し側で決める
 */
export default function Panel({
  title,
  footer,
  collapsed = false,
  onToggleCollapsed,
  children,
  className,
  ...rest
}: PanelProps) {
  return (
    <div className={`${styles.panel} ${className ?? ""}`} {...rest}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {onToggleCollapsed && (
          <button
            type="button"
            className={styles.collapseButton}
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "パネルを開く" : "パネルを畳む"}
            title={collapsed ? "パネルを開く" : "パネルを畳む"}
          >
            <IconChevronDown
              size={18}
              className={collapsed ? styles.chevronCollapsed : undefined}
            />
          </button>
        )}
      </div>

      {!collapsed && (
        <>
          <div className={styles.scrollArea}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </>
      )}
    </div>
  );
}
