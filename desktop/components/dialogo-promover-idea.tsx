'use client'

import { useState } from 'react'
import {
  ArrowUpRight,
  Loader2,
  MessageSquare,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useFlexgoal } from '@/lib/flexgoal/store'
import type { Idea } from '@/lib/flexgoal/types'
import {
  ErrorClaveNoConfigurada,
  ErrorRespuestaIA,
  ErrorSinConexion,
  corregirEstructura,
  generarEstructuraDesdeIdea,
  type PropuestaIA,
} from '@/lib/flexgoal/ia'

type Paso = 'elegir' | 'generando' | 'previsualizando' | 'corrigiendo' | 'error'

interface Props {
  idea: Idea | null
  onCerrar: () => void
  onIrAAjustes: () => void
}

export function DialogoPromoverIdea({ idea, onCerrar, onIrAAjustes }: Props) {
  const { promoverIdea, promoverIdeaConEstructura } = useFlexgoal()
  const [paso, setPaso] = useState<Paso>('elegir')
  const [propuesta, setPropuesta] = useState<PropuestaIA | null>(null)
  const [feedback, setFeedback] = useState('')
  const [mensajeError, setMensajeError] = useState('')
  const [claveFaltante, setClaveFaltante] = useState(false)

  function reiniciarYCerrar() {
    setPaso('elegir')
    setPropuesta(null)
    setFeedback('')
    setMensajeError('')
    setClaveFaltante(false)
    onCerrar()
  }

  function manejarError(error: unknown) {
    if (error instanceof ErrorClaveNoConfigurada) {
      setClaveFaltante(true)
      setMensajeError('No configuraste una clave de API de Gemini todavía.')
    } else if (error instanceof ErrorSinConexion) {
      setClaveFaltante(false)
      setMensajeError('No hay conexión a internet. Probá de nuevo cuando estés online.')
    } else if (error instanceof ErrorRespuestaIA) {
      setClaveFaltante(false)
      setMensajeError(error.message)
    } else {
      setClaveFaltante(false)
      setMensajeError('Algo salió mal generando la propuesta.')
    }
    setPaso('error')
  }

  async function generar() {
    if (!idea) return
    setPaso('generando')
    try {
      const resultado = await generarEstructuraDesdeIdea(idea.titulo, idea.notas)
      setPropuesta(resultado)
      setPaso('previsualizando')
    } catch (error) {
      manejarError(error)
    }
  }

  async function pedirCorreccion() {
    if (!idea || !propuesta || !feedback.trim()) return
    setPaso('generando')
    try {
      const resultado = await corregirEstructura(idea.titulo, propuesta, feedback.trim())
      setPropuesta(resultado)
      setFeedback('')
      setPaso('previsualizando')
    } catch (error) {
      manejarError(error)
    }
  }

  function aceptarPropuesta() {
    if (!idea || !propuesta) return
    promoverIdeaConEstructura(idea.id, idea.notas ?? '', propuesta.objetivos)
    reiniciarYCerrar()
  }

  function promoverManual() {
    if (!idea) return
    promoverIdea(idea.id)
    reiniciarYCerrar()
  }

  return (
    <Dialog
      open={Boolean(idea)}
      onOpenChange={(abierto) => {
        if (!abierto) reiniciarYCerrar()
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {paso === 'elegir' && idea && (
          <>
            <DialogHeader>
              <DialogTitle>¿Cómo querés organizar &ldquo;{idea.titulo}&rdquo;?</DialogTitle>
              <DialogDescription>
                Podés armar la estructura vos mismo o dejar que la IA proponga objetivos y
                tareas para revisar y ajustar antes de confirmar.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 py-2">
              <button
                onClick={generar}
                className="border-primary/30 bg-primary/5 hover:bg-primary/10 flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
              >
                <Sparkles className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-[15px] font-medium">Automático (IA)</p>
                  <p className="text-muted-foreground mt-0.5 text-[13px]">
                    Gemini propone objetivos y tareas según tu idea. Vos revisás antes de
                    confirmar.
                  </p>
                </div>
              </button>
              <button
                onClick={promoverManual}
                className="hover:bg-muted flex items-start gap-3 rounded-lg border p-4 text-left transition-colors"
              >
                <ArrowUpRight className="text-muted-foreground mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-[15px] font-medium">Manual</p>
                  <p className="text-muted-foreground mt-0.5 text-[13px]">
                    Se crea la meta vacía. Agregás los objetivos y tareas vos, cuando quieras.
                  </p>
                </div>
              </button>
            </div>
          </>
        )}

        {paso === 'generando' && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
            <p className="text-muted-foreground text-[13px]">Generando propuesta con Gemini…</p>
          </div>
        )}

        {paso === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle>No se pudo generar la propuesta</DialogTitle>
              <DialogDescription>{mensajeError}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              {claveFaltante ? (
                <Button onClick={onIrAAjustes} className="w-full">
                  Ir a Ajustes a configurar la clave
                </Button>
              ) : (
                <Button onClick={generar} className="w-full">
                  Reintentar
                </Button>
              )}
              <Button variant="ghost" onClick={() => setPaso('elegir')} className="w-full">
                Volver
              </Button>
            </DialogFooter>
          </>
        )}

        {paso === 'previsualizando' && propuesta && (
          <>
            <DialogHeader>
              <DialogTitle>Propuesta de Gemini</DialogTitle>
              <DialogDescription>
                Revisá antes de confirmar. Podés pedir cambios o crear la meta tal cual está.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {propuesta.objetivos.map((obj, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="text-[14px] font-medium text-pretty">{obj.titulo}</p>
                  {obj.criterioExito && (
                    <p className="text-muted-foreground mt-1 text-[12px]">
                      Listo cuando: {obj.criterioExito}
                    </p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {obj.tareas.map((t, j) => (
                      <li
                        key={j}
                        className="text-muted-foreground flex items-center justify-between gap-2 text-[13px]"
                      >
                        <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
                        <span className="shrink-0 tabular-nums">{t.estimacionMin} min</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {paso === 'previsualizando' && (
              <div className="space-y-2 border-t pt-3">
                <label htmlFor="feedback-ia" className="text-muted-foreground text-[12px]">
                  ¿Algo que ajustar? (opcional)
                </label>
                <Textarea
                  id="feedback-ia"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={2}
                  placeholder="Ej: menos tareas de lectura, más práctica"
                  className="text-[13px]"
                />
                {feedback.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pedirCorreccion}
                    className="w-full"
                  >
                    <MessageSquare className="size-3.5" aria-hidden />
                    Pedir este cambio
                  </Button>
                )}
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button onClick={aceptarPropuesta} className="w-full">
                <Wand2 className="size-4" aria-hidden />
                Crear meta con esta estructura
              </Button>
              <Button variant="ghost" onClick={() => setPaso('elegir')} className="w-full">
                Volver
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
