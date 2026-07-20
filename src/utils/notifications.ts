import { Booking } from "../types";

// Helper to check if Notification API is supported in the current browser/context
export const isNotificationSupported = (): boolean => {
  return typeof window !== "undefined" && "Notification" in window;
};

// Request permission for browser notifications
export const requestBrowserPermission = async (): Promise<NotificationPermission> => {
  if (!isNotificationSupported()) {
    return "denied";
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (e) {
    console.error("Erro ao solicitar permissão de notificação:", e);
    return "default";
  }
};

// Get current notification permission state
export const getNotificationPermissionState = (): NotificationPermission => {
  if (!isNotificationSupported()) {
    return "denied";
  }
  return Notification.permission;
};

// Send a native browser notification
export const sendBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return null;
  }

  try {
    // Add a custom icon if desired, or let browser handle default
    const defaultOptions: NotificationOptions = {
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      silent: false,
      ...options,
    };
    return new Notification(title, defaultOptions);
  } catch (e) {
    console.error("Erro ao exibir notificação nativa do navegador:", e);
    return null;
  }
};

// Parse booking date and time in browser local context
export const getBookingStartAndDiff = (b: Booking): { bookingStart: Date; diffMin: number } => {
  const [year, month, day] = b.data.split("-").map(Number);
  const [hours, minutes] = b.horaInicial.split(":").map(Number);
  
  const now = new Date();
  const bookingStart = new Date(year, month - 1, day, hours, minutes, 0, 0);
  const diffMs = bookingStart.getTime() - now.getTime();
  const diffMin = diffMs / 60000;
  
  return { bookingStart, diffMin };
};
