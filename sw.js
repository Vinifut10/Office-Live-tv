const CACHE="missoes-divertidas-v3127";
self.addEventListener("install",()=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("push",e=>{
 let d={};try{d=e.data?.json()||{}}catch{d={body:e.data?.text()||""}}
 e.waitUntil(self.registration.showNotification(d.title||"Missões Divertidas",{body:d.body||"Você tem uma nova notificação.",icon:d.icon||"/app-icon.jpg",badge:"/app-icon.jpg",tag:d.tag||"missoes",data:{url:d.url||"/"},renotify:true}));
});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(ws=>{for(const w of ws){if("focus"in w){w.navigate(e.notification.data?.url||"/");return w.focus()}}return clients.openWindow(e.notification.data?.url||"/")}))});
