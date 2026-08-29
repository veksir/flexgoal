/**
 * Firma visual de flexgoal: tres barras que se reacomodan.
 * Es la metáfora del producto — el plan cede, no se rompe.
 */
export function Marca({ compacto = false }: { compacto?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className="flex h-5 items-end gap-[3px]"
        title="flexgoal"
      >
        <span className="bg-primary h-2.5 w-[3px] rounded-full" />
        <span className="bg-primary h-5 w-[3px] rounded-full" />
        <span className="bg-primary/40 h-3.5 w-[3px] rounded-full" />
      </span>
      {!compacto && (
        <span className="text-[15px] font-semibold tracking-tight">
          flexgoal
        </span>
      )}
    </span>
  )
}
