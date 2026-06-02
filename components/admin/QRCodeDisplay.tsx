"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  url: string;
  label?: string;
}

export function QRCodeDisplay({ url, label = "Scan to join" }: Props) {
  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svg = document.getElementById("gym-qr")?.outerHTML ?? "";
    printWindow.document.write(`
      <html><head><title>Orange Theory Gym Competition — Join</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:16px;">
        ${svg}
        <p style="font-size:24px;font-weight:bold;">Scan to Join the Competition</p>
        <p style="font-size:14px;color:#666;">${url}</p>
        <script>window.print();window.close();</script>
      </body></html>
    `);
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 w-fit">
      <QRCodeSVG id="gym-qr" value={url} size={150} bgColor="#ffffff" fgColor="#0f172a" level="M" />
      <p className="text-xs text-slate-500">{label}</p>
      <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs w-full">
        <Download className="w-3.5 h-3.5 mr-1.5" /> Print QR Code
      </Button>
    </div>
  );
}
