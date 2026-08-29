'use client'

import { useEffect, useState } from 'react'
import { Check, Eye, EyeOff, KeyRound, Lock, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Encabezado } from '@/components/encabezado'
import { cn } from '@/lib/utils'
import {
  ACENTOS,
  DENSIDADES,
  MODOS,
  RADIOS,
  useTema,
} from '@/lib/flexgoal/tema'
import { useCronometro } from '@/lib/flexgoal/cronometro'
import {
  borrarClaveAPI,
  claveEstaCifrada,
  guardarClaveAPI,
  obtenerClaveAPI,
} from '@/lib/flexgoal/ia'

export default function PaginaDiseno() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-10">
      <Encabezado
        sobretitulo="Apariencia e integraciones"
        titulo="Diseño"
        detalle="Ajustá cómo se ve flexgoal y conectá la generación con IA si la querés usar."
      />

      <div className="mt-8 space-y-8">
        <SeccionApariencia />
        <SeccionPomodoro />
        <SeccionIA />
      </div>
    </div>
  )
}

function SeccionApariencia() {
  const { tema, setTema, reiniciarTema } = useTema()

  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="label-instrumento text-muted-foreground">Apariencia</h2>
        <button
          type="button"
          onClick={reiniciarTema}
          className="text-muted-foreground hover:text-foreground text-[12px] underline underline-offset-2"
        >
          Restaurar valores por defecto
        </button>
      </div>

      <Campo etiqueta="Acento">
        <div className="flex flex-wrap items-center gap-2">
          {ACENTOS.map((a) => (
            <button
              key={a.id}
              onClick={() => setTema({ acento: a.id })}
              aria-pressed={tema.acento === a.id}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
                tema.acento === a.id ? 'border-foreground' : 'border-border hover:bg-muted',
              )}
            >
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: a.muestra }}
                aria-hidden
              />
              {a.nombre}
              {tema.acento === a.id && <Check className="size-3.5" aria-hidden />}
            </button>
          ))}
          <label
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-colors',
              tema.acento === 'personalizado'
                ? 'border-foreground'
                : 'border-border hover:bg-muted',
            )}
          >
            <span
              className="size-3 rounded-full border"
              style={{ backgroundColor: tema.colorPersonalizado || '#888888' }}
              aria-hidden
            />
            Personalizado
            <input
              type="color"
              value={tema.colorPersonalizado || '#6b7280'}
              onChange={(e) =>
                setTema({ acento: 'personalizado', colorPersonalizado: e.target.value })
              }
              className="sr-only"
            />
          </label>
        </div>
      </Campo>

      <Campo etiqueta="Densidad">
        <SelectorPill
          opciones={DENSIDADES}
          valor={tema.densidad}
          onCambiar={(id) => setTema({ densidad: id })}
        />
      </Campo>

      <Campo etiqueta="Bordes">
        <SelectorPill
          opciones={RADIOS}
          valor={tema.radio}
          onCambiar={(id) => setTema({ radio: id })}
        />
      </Campo>

      <Campo etiqueta="Modo">
        <SelectorPill
          opciones={MODOS}
          valor={tema.modo}
          onCambiar={(id) => setTema({ modo: id })}
        />
      </Campo>
    </section>
  )
}

function SeccionPomodoro() {
  const { configPomodoro, setConfigPomodoro } = useCronometro()

  return (
    <section className="space-y-4">
      <h2 className="label-instrumento text-muted-foreground">Pomodoro</h2>
      <div className="bg-card flex flex-wrap items-center gap-6 rounded-xl border pad-card">
        <div className="space-y-1.5">
          <label htmlFor="pomodoro-trabajo" className="text-muted-foreground text-[12px]">
            Trabajo (min)
          </label>
          <input
            id="pomodoro-trabajo"
            type="number"
            min={1}
            max={180}
            value={configPomodoro.trabajoMin}
            onChange={(e) =>
              setConfigPomodoro({ trabajoMin: Math.max(1, Number(e.target.value) || 1) })
            }
            className="tnum focus-visible:ring-ring h-9 w-20 rounded-md border bg-transparent px-2.5 text-[14px] focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="pomodoro-descanso" className="text-muted-foreground text-[12px]">
            Descanso (min)
          </label>
          <input
            id="pomodoro-descanso"
            type="number"
            min={1}
            max={60}
            value={configPomodoro.descansoMin}
            onChange={(e) =>
              setConfigPomodoro({ descansoMin: Math.max(1, Number(e.target.value) || 1) })
            }
            className="tnum focus-visible:ring-ring h-9 w-20 rounded-md border bg-transparent px-2.5 text-[14px] focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <p className="text-muted-foreground max-w-[28ch] text-[12px] leading-relaxed">
          Se usa cuando elegís modo Pomodoro al iniciar una sesión desde Hoy.
        </p>
      </div>
    </section>
  )
}

function SeccionIA() {
  const [clave, setClave] = useState('')
  const [claveGuardada, setClaveGuardada] = useState(false)
  const [mostrar, setMostrar] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const cifrada = claveEstaCifrada()

  useEffect(() => {
    obtenerClaveAPI().then((existente) => {
      setClaveGuardada(Boolean(existente))
      setCargando(false)
    })
  }, [])

  async function guardar() {
    if (!clave.trim() || guardando) return
    setGuardando(true)
    try {
      await guardarClaveAPI(clave.trim())
      setClaveGuardada(true)
      setClave('')
      setMensaje('Clave guardada.')
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo guardar la clave.')
    } finally {
      setGuardando(false)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  async function borrar() {
    if (guardando) return
    setGuardando(true)
    try {
      await borrarClaveAPI()
      setClaveGuardada(false)
      setMensaje('Clave eliminada.')
    } finally {
      setGuardando(false)
      setTimeout(() => setMensaje(null), 3000)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="label-instrumento text-muted-foreground">Integración con IA</h2>

      <div className="bg-card space-y-4 rounded-xl border pad-card">
        <div className="flex items-start gap-3">
          <Sparkles className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0">
            <p className="text-[14px] font-medium">Generar estructura con Gemini</p>
            <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
              Al promover una idea a meta, podés pedirle a Gemini que proponga objetivos y
              tareas. Necesitás tu propia clave de API — se pide gratis en{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                aistudio.google.com/apikey
              </a>
              .
            </p>
          </div>
        </div>

        {!cargando && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2 text-[12px]">
              {cifrada ? (
                <>
                  <Lock className="text-muted-foreground size-3.5" aria-hidden />
                  <span className="text-muted-foreground">
                    Se guarda cifrada con el llavero de este equipo.
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="text-amber-600 size-3.5" aria-hidden />
                  <span className="text-amber-600">
                    Corriendo fuera de la app de escritorio: se guarda sin cifrar en este
                    navegador. Usá la app instalada para que quede protegida.
                  </span>
                </>
              )}
            </div>

            {claveGuardada ? (
              <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2.5">
                <span className="text-[13px]">Clave configurada · ••••••••••••</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={borrar}
                  disabled={guardando}
                  className="text-destructive h-8"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Quitar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={mostrar ? 'text' : 'password'}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder="Pegá tu clave de API acá"
                    className="placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent px-3 pr-9 text-[13px] focus-visible:ring-2 focus-visible:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrar((m) => !m)}
                    className="text-muted-foreground absolute top-1/2 right-2 -translate-y-1/2"
                    aria-label={mostrar ? 'Ocultar clave' : 'Mostrar clave'}
                  >
                    {mostrar ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <Button onClick={guardar} disabled={!clave.trim() || guardando} className="h-10">
                  Guardar
                </Button>
              </div>
            )}

            {mensaje && <p className="text-muted-foreground text-[12px]">{mensaje}</p>}
          </div>
        )}
      </div>
    </section>
  )
}

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[12px]">{etiqueta}</p>
      {children}
    </div>
  )
}

function SelectorPill<T extends string>({
  opciones,
  valor,
  onCambiar,
}: {
  opciones: readonly { id: T; nombre: string }[]
  valor: T
  onCambiar: (id: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {opciones.map((o) => (
        <button
          key={o.id}
          onClick={() => onCambiar(o.id)}
          aria-pressed={valor === o.id}
          className={cn(
            'rounded-full border px-3 py-1.5 text-[13px] transition-colors',
            valor === o.id
              ? 'border-foreground bg-foreground text-background'
              : 'border-border hover:bg-muted',
          )}
        >
          {o.nombre}
        </button>
      ))}
    </div>
  )
}
