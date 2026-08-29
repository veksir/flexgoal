export function Encabezado({
  sobretitulo,
  titulo,
  detalle,
  acciones,
}: {
  sobretitulo?: string
  titulo: string
  detalle?: string
  acciones?: React.ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div className="min-w-0">
        {sobretitulo && (
          <p className="label-instrumento text-muted-foreground first-letter:uppercase">
            {sobretitulo}
          </p>
        )}
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-[28px]">
          {titulo}
        </h1>
        {detalle && (
          <p className="text-muted-foreground mt-1.5 max-w-[60ch] text-sm leading-relaxed text-pretty">
            {detalle}
          </p>
        )}
      </div>
      {acciones && <div className="flex shrink-0 items-center gap-2">{acciones}</div>}
    </header>
  )
}
