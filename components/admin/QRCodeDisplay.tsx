"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface Props {
  teamName: string;
  joinCode: string;
}

export function QRCodeDisplay({ teamName, joinCode }: Props) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "");
  const joinUrl = `${appUrl}/join?code=${joinCode}`;

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const svg = document.getElementById(`qr-${joinCode}`)?.outerHTML ?? "";
    printWindow.document.write(`
      <html><head><title>QR Code — ${teamName}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;gap:16px;">
        ${svg}
        <p style="font-size:24px;font-weight:bold;">${teamName}</p>
        <p style="font-size:14px;color:#666;">Code: ${joinCode}</p>
        <script>window.print();window.close();</script>
      </body></html>
    `);
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
      <QRCodeSVG
        id={`qr-${joinCode}`}
        value={joinUrl}
        size={140}
        bgColor="#ffffff"
        fgColor="#0f172a"
        level="M"
      />
      <div className="text-center">
        <p className="text-xs text-slate-500">Scan to join</p>
        <p className="font-mono text-sm font-bold text-slate-700 mt-0.5 tracking-widest">{joinCode}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="text-xs w-full"
      >
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Print QR Code
      </Button>
    </div>
  );
}
