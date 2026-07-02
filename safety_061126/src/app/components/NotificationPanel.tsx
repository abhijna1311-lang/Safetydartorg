import { X, CheckCircle2, AlertCircle, Clock, MessageSquare, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'comment';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  reportId?: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
  show: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClick?: (notification: Notification) => void;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

export function NotificationPanel({ 
  notifications,
  show, 
  onClose, 
  onMarkAsRead, 
  onMarkAllAsRead,
  onClick,
  buttonRef
}: NotificationPanelProps) {
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const panelRef = useRef<HTMLDivElement>(null);

  // Calculate position based on button position
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (show && buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px gap below button
        right: window.innerWidth - rect.right, // Align right edge
      });
    }
  }, [show, buttonRef]);

  if (!show) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'info':
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getBgColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50/80';
      case 'warning':
        return 'bg-amber-50/80';
      case 'comment':
        return 'bg-blue-50/80';
      case 'info':
      default:
        return 'bg-slate-50/80';
    }
  };

  const content = (
    <>
      {/* Notifications Scrim */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(6, 28, 61, 0.10)' }}
        onClick={onClose}
      />
      
      {/* Notifications Panel */}
      <div 
        ref={panelRef}
        className="fixed w-96 bg-white overflow-hidden z-50"
        style={{
          top: `${position.top}px`,
          right: `${position.right}px`,
          borderRadius: '16px',
          boxShadow: '0 18px 45px rgba(5, 33, 74, 0.28), 0 4px 10px rgba(5, 33, 74, 0.12)'
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-200/60 bg-slate-50/40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[#00205B] font-['Poppins']">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-[#007DBA] text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-200/50 rounded-md transition-colors"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-xs text-[#007DBA] hover:text-[#00205B] font-medium transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-['Poppins']">No notifications yet</p>
              <p className="text-xs text-slate-400 font-['Poppins'] mt-1">
                You'll see updates about your cases here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200/40">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 transition-all cursor-pointer hover:bg-slate-50/60 ${
                    !notification.isRead ? 'bg-blue-50/20' : ''
                  }`}
                  onClick={() => {
                    onMarkAsRead(notification.id);
                    onClick?.(notification);
                  }}
                >
                  <div className="flex gap-3">
                    <div className={`flex-shrink-0 w-10 h-10 ${getBgColor(notification.type)} rounded-lg flex items-center justify-center`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`text-sm font-['Poppins'] ${!notification.isRead ? 'font-semibold text-[#00205B]' : 'font-medium text-slate-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 w-2 h-2 bg-[#007DBA] rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-['Poppins'] leading-relaxed mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400 font-['Poppins']">
                          {notification.timestamp}
                        </span>
                        {notification.actionLabel && (
                          <button className="text-xs text-[#007DBA] hover:text-[#00205B] font-medium transition-colors">
                            {notification.actionLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-200/60 bg-slate-50/20">
            <button className="text-xs text-[#007DBA] hover:text-[#00205B] font-medium transition-colors w-full text-center">
              View all notifications
            </button>
          </div>
        )}
      </div>
    </>
  );

  return createPortal(content, document.body);
}