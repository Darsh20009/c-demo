import { useEffect, useRef, useCallback } from "react";
import { useCustomer } from "@/contexts/CustomerContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export function CustomerNotificationListener() {
  const { customer } = useCustomer();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const showNativeBrowserNotification = useCallback((title: string, body: string, icon: string, url: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.showNotification(title, {
        body,
        icon: icon ? undefined : "/logo.png",
        badge: "/favicon.png",
        dir: "rtl",
        lang: "ar",
        data: { url },
        tag: `customer-notif-${Date.now()}`,
      } as NotificationOptions);
    }).catch(() => {});
  }, []);

  const connect = useCallback(() => {
    if (!customer?.id || !mountedRef.current) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/orders`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) { ws.close(); return; }
      ws.send(JSON.stringify({
        type: "subscribe",
        clientType: "customer",
        userId: customer.id,
        customerId: customer.id,
      }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "welcome") {
          ws.send(JSON.stringify({
            type: "subscribe",
            clientType: "customer",
            userId: customer.id,
            customerId: customer.id,
          }));
          return;
        }

        if (msg.type === "notification" && msg.notification) {
          const n = msg.notification;
          const title = n.title || "إشعار جديد";
          const body = n.message || "";
          const icon = n.icon || "🔔";
          const link = n.link || "/";

          toast({
            title: `${icon} ${title}`,
            description: body,
            duration: 6000,
          });

          showNativeBrowserNotification(title, body, icon, link);

          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
        }

        if (msg.type === "order_updated" && msg.order) {
          queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/my-orders"] });
        }
      } catch (_) {}
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [customer?.id, toast, showNativeBrowserNotification]);

  useEffect(() => {
    mountedRef.current = true;
    if (customer?.id) {
      connect();
    }
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [customer?.id, connect]);

  return null;
}
