import { useState } from "react";
import { getInitials } from "../utils/getInitials";
import FlatIcon from "../components/FlatIcon";
import {
  useMarkNotificationReadMutation,
  useNotifications,
} from "./hooks/useLiveQueries";
import { useAuthStore } from "../store/authStore";

interface TopbarProps {
  toggleSidebar: () => void;
  isMobile: boolean;
}

const Topbar = ({ toggleSidebar, isMobile }: TopbarProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuthStore();
  const displayName = user?.name || "Chuka Rolad";
  const userPhoto = user?.photo || "";
  const userEmail = user?.role || "MD/CEO";

  const { data: notificationsEnvelope } = useNotifications();
  const notificationsList = Array.isArray(notificationsEnvelope)
    ? notificationsEnvelope
    : (notificationsEnvelope as any)?.data || [];
  const rawUnread = (notificationsEnvelope as any)?.unreadCount;
  const unreadCount =
    typeof rawUnread === "number"
      ? rawUnread
      : notificationsList.filter((n: any) => n.read === false || n.isRead === false || (!("read" in n) && !("isRead" in n))).length;
  const markReadMutation = useMarkNotificationReadMutation();

  return (
    <header className="app-topbar w-full min-h-18.5 flex items-center justify-between gap-4 px-4 sm:px-6 bg-white shrink-0">
      <div className="flex items-center flex-1">
        <button
          type="button"
          aria-label={isMobile ? "Open navigation" : "Collapse navigation"}
          onClick={toggleSidebar}
          className="topbar-icon mr-4"
        >
          <FlatIcon
            name={isMobile ? "menu-burger" : "angle-small-left"}
            className="text-[15px]"
          />
        </button>

        {/* Global search hidden until its cross-module search endpoint is available. */}
      </div>

      {/* right section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* bell & history icons */}
        <div className="relative flex items-center gap-1 text-slate-500">
          {/* Calendar shortcut hidden until calendar navigation is implemented. */}
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((current) => !current)}
            className="topbar-icon relative"
          >
            <FlatIcon name="bell" className="text-[16px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 z-1000 w-80 overflow-hidden rounded-2xl border border-brand-teal/10 bg-white shadow-[0_18px_48px_rgba(23,35,30,0.16)]">
              <div className="flex items-center justify-between border-b border-border-warm px-4 py-3">
                <div>
                  <p className="text-xs font-bold text-charcoal">
                    Notifications
                  </p>
                  <p className="mt-0.5 text-[9px] text-muted-gray">
                    {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto p-2">
                {notificationsList.length === 0 ? (
                  <p className="px-3 py-8 text-center text-[11px] text-muted-gray">
                    No new notifications.
                  </p>
                ) : (
                  notificationsList.slice(0, 8).map((notification: any) => {
                    const isRead = notification.read ?? notification.isRead ?? false;
                    const content = notification.title || notification.message || "New notification";
                    return (
                      <button
                        type="button"
                        key={notification.id}
                        onClick={() => {
                          if (!isRead) {
                            markReadMutation.mutate(notification.id);
                          }
                        }}
                        className={`mb-1 w-full rounded-xl px-3 py-3 text-left text-[11px] leading-relaxed transition-colors last:mb-0 ${
                          isRead
                            ? "text-muted-gray hover:bg-neutral-50"
                            : "bg-brand-teal/6 font-semibold text-charcoal hover:bg-brand-teal/10"
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          {!isRead && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-lime" />
                          )}
                          <span className="flex-1">
                            <span className="block">{content}</span>
                            {notification.createdAt && (
                              <span className="mt-0.5 block text-[9px] text-muted-gray font-normal">
                                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 hidden mlg:block" />

        {/* profile details */}
        <div className="flex items-center gap-3">
          <div className="hidden mlg:flex flex-col text-right">
            <span className="text-sm font-semibold text-charcoal leading-none">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-gray tracking-wide font-medium mt-1.5 leading-none">
              {userEmail}
            </span>
          </div>

          {/* avatar */}
          <div className="relative h-10 w-10 shrink-0">
            <div className="flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full bg-brand-teal text-xs font-bold text-white shadow-sm ring-2 ring-[#dce9eb]">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{getInitials(displayName)}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-lime" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
