import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

export function EstadoVacio({
  Icono,
  titulo,
  detalle,
  accion,
}: {
  Icono: LucideIcon
  titulo: string
  detalle: string
  accion?: { href: string; texto: string }
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center">
      <span
        aria-hidden
        className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full"
      >
        <Icono className="size-[18px]" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        <p className="text-muted-foreground mx-auto max-w-[42ch] text-[13px] leading-relaxed">
          {detalle}
        </p>
      </div>
      {accion && (
        <Link
          href={accion.href}
          className="border-border hover:bg-accent focus-visible:ring-ring mt-1 inline-flex h-9 items-center rounded-md border px-3 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {accion.texto}
        </Link>
      )}
    </div>
  )
}
