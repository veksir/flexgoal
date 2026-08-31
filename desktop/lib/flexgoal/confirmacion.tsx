'use client'

/**
 * Reemplazo de window.confirm() con el estilo propio de la app.
 * window.confirm() es un diálogo del sistema operativo/navegador —
 * no se puede tocar el estilo, y por eso se ve "tosco" y fuera de
 * lugar comparado con el resto de la interfaz.
 *
 * Uso: `const ok = await confirmar({ titulo, descripcion })` — misma
 * forma que window.confirm (devuelve boolean), pero renderizado con
 * el Dialog propio del proyecto.
 */

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface OpcionesConfirmacion {
  titulo: string
  descripcion: string
  textoConfirmar?: string
  textoCancelar?: string
  /** Pinta el botón de confirmar en rojo — para acciones que borran
   * algo o no se pueden deshacer. */
  destructivo?: boolean
}

type ResolverConfirmacion = (valor: boolean) => void

interface ContextoConfirmacion {
  confirmar: (opciones: OpcionesConfirmacion) => Promise<boolean>
}

const Ctx = createContext<ContextoConfirmacion | null>(null)

export function ProveedorConfirmacion({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<OpcionesConfirmacion | null>(null)
  const resolverRef = useRef<ResolverConfirmacion | null>(null)

  const confirmar = useCallback((opciones: OpcionesConfirmacion) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
      setPendiente(opciones)
    })
  }, [])

  function cerrar(valor: boolean) {
    resolverRef.current?.(valor)
    resolverRef.current = null
    setPendiente(null)
  }

  return (
    <Ctx.Provider value={{ confirmar }}>
      {children}
      <Dialog open={pendiente !== null} onOpenChange={(abierto) => !abierto && cerrar(false)}>
        <DialogContent className="sm:max-w-sm">
          {pendiente && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {pendiente.destructivo && (
                    <span className="bg-destructive/10 text-destructive mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
                      <AlertTriangle className="size-4" aria-hidden />
                    </span>
                  )}
                  <div className="min-w-0">
                    <DialogTitle>{pendiente.titulo}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {pendiente.descripcion}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <DialogFooter className="mt-2">
                <Button variant="ghost" onClick={() => cerrar(false)}>
                  {pendiente.textoCancelar ?? 'Cancelar'}
                </Button>
                <Button
                  variant={pendiente.destructivo ? 'destructive' : 'default'}
                  onClick={() => cerrar(true)}
                  autoFocus
                >
                  {pendiente.textoConfirmar ?? 'Confirmar'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  )
}

export function useConfirmacion() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useConfirmacion debe usarse dentro de ProveedorConfirmacion')
  return ctx.confirmar
}
