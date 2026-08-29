'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, Lightbulb, Plus, RotateCcw, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useFlexgoal } from '@/lib/flexgoal/store'
import { fechaLegible } from '@/lib/flexgoal/engine'
import { Encabezado } from '@/components/encabezado'
import { EstadoVacio } from '@/components/estado-vacio'
import { DialogoPromoverIdea } from '@/components/dialogo-promover-idea'
import type { Idea } from '@/lib/flexgoal/types'

export default function PaginaIdeas() {
  const { estado, agregarIdea, descartarIdea } = useFlexgoal()
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [ideaAPromover, setIdeaAPromover] = useState<Idea | null>(null)

  const { inbox, promovidas, descartadas } = useMemo(
    () => ({
      inbox: estado.ideas.filter((i) => i.estado === 'inbox'),
      promovidas: estado.ideas.filter((i) => i.estado === 'promovida'),
      descartadas: estado.ideas.filter((i) => i.estado === 'descartada'),
    }),
    [estado.ideas],
  )

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const limpio = titulo.trim()
    if (!limpio) return
    agregarIdea(limpio, notas.trim() || undefined)
    setTitulo('')
    setNotas('')
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo="Bandeja de entrada"
        titulo="Ideas"
        detalle="Anotar no compromete a nada. Una idea solo se vuelve meta cuando vos lo decidís."
      />

      {/* Captura sin fricción */}
      <form
        onSubmit={enviar}
        className="bg-card mt-6 space-y-3 rounded-xl border pad-card"
      >
        <div>
          <label htmlFor="idea-titulo" className="sr-only">
            Idea
          </label>
          <input
            id="idea-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="¿Qué se te ocurrió?"
            className="placeholder:text-muted-foreground focus-visible:ring-ring h-11 w-full rounded-md border bg-transparent px-3 text-[15px] focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <div>
          <label htmlFor="idea-notas" className="sr-only">
            Notas opcionales
          </label>
          <textarea
            id="idea-notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            placeholder="Contexto opcional. Podés dejarlo vacío."
            className="placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-none rounded-md border bg-transparent px-3 py-2 text-[13px] leading-relaxed focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-[11px]">
            Se guarda en este dispositivo.
          </p>
          <Button type="submit" size="sm" className="h-9" disabled={!titulo.trim()}>
            <Plus className="size-4" aria-hidden />
            Anotar
          </Button>
        </div>
      </form>

      <div className="mt-8 space-y-8">
        <section aria-labelledby="ideas-inbox" className="space-y-3">
          <h2 id="ideas-inbox" className="label-instrumento text-muted-foreground">
            Sin decidir · {inbox.length}
          </h2>

          {inbox.length === 0 ? (
            <EstadoVacio
              Icono={Lightbulb}
              titulo="La bandeja está vacía"
              detalle="Eso también está bien. Cuando aparezca algo, lo anotás acá sin pensar si es viable."
            />
          ) : (
            <ul className="space-y-2">
              {inbox.map((idea) => (
                <li
                  key={idea.id}
                  className="bg-card flex flex-col gap-3 rounded-lg border pad-card sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] leading-snug font-medium text-pretty">
                      {idea.titulo}
                    </p>
                    {idea.notas && (
                      <p className="text-muted-foreground mt-1 max-w-[54ch] text-[13px] leading-relaxed">
                        {idea.notas}
                      </p>
                    )}
                    <p className="text-muted-foreground/80 mt-1.5 text-[11px] first-letter:uppercase">
                      Anotada el {fechaLegible(idea.creadaEn)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      className="h-9"
                      onClick={() => setIdeaAPromover(idea)}
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                      Volver meta
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground h-9"
                      onClick={() => descartarIdea(idea.id)}
                    >
                      <X className="size-4" aria-hidden />
                      No ahora
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {promovidas.length > 0 && (
          <section aria-labelledby="ideas-promovidas" className="space-y-3">
            <h2
              id="ideas-promovidas"
              className="label-instrumento text-muted-foreground"
            >
              Ya son metas · {promovidas.length}
            </h2>
            <ul className="space-y-2">
              {promovidas.map((idea) => (
                <li
                  key={idea.id}
                  className="border-primary/25 bg-signal-soft/40 flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <ArrowUpRight
                    className="text-primary size-4 shrink-0"
                    aria-hidden
                  />
                  <p className="min-w-0 flex-1 text-[13px]">{idea.titulo}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {descartadas.length > 0 && (
          <section aria-labelledby="ideas-descartadas" className="space-y-3">
            <h2
              id="ideas-descartadas"
              className="label-instrumento text-muted-foreground"
            >
              Descartadas · {descartadas.length}
            </h2>
            <p className="text-muted-foreground max-w-[60ch] text-[13px] leading-relaxed">
              No las borramos. A veces una idea vuelve a tener sentido más adelante.
            </p>
            <ul className="space-y-2">
              {descartadas.map((idea) => (
                <li
                  key={idea.id}
                  className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2.5"
                >
                  <p
                    className={cn(
                      'text-muted-foreground min-w-0 flex-1 text-[13px]',
                    )}
                  >
                    {idea.titulo}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground h-9 shrink-0"
                    onClick={() => descartarIdea(idea.id)}
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    Recuperar
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <DialogoPromoverIdea
        idea={ideaAPromover}
        onCerrar={() => setIdeaAPromover(null)}
        onIrAAjustes={() => router.push('/diseno')}
      />
    </div>
  )
}
