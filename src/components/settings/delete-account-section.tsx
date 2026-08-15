import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { TrashIcon, WarningOctagonIcon } from '@phosphor-icons/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card.tsx'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog.tsx'
import { Button } from '#/components/ui/button.tsx'
import { Input } from '#/components/ui/input.tsx'
import { Label } from '#/components/ui/label.tsx'
import { deleteClerkAccount } from '#/server/account.ts'
import { api } from '../../../convex/_generated/api'

const CONFIRMATION_TEXT = 'DELETE'

export function DeleteAccountSection() {
  const navigate = useNavigate()
  const softDelete = useMutation(api.users.softDelete)

  const [confirmInput, setConfirmInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const isConfirmed =
    confirmInput.trim().toUpperCase() === CONFIRMATION_TEXT

  async function handleDelete() {
    if (!isConfirmed) return
    setError(null)
    setIsDeleting(true)

    try {
      // Step 1: Soft-delete in Convex (anonymize submissions, mark record)
      await softDelete({})

      // Step 2: Delete user from Clerk (revokes all sessions)
      await deleteClerkAccount()

      // Step 3: Redirect to home (session is now invalid)
      void navigate({ to: '/' })
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : 'Something went wrong. Please try again or contact support.'
      setError(message)
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <WarningOctagonIcon className="size-5" aria-hidden="true" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive dark:text-red-400">
            Deleting your account will:
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
            <li>Anonymize all your past submissions (shown as &ldquo;Deleted User&rdquo;)</li>
            <li>Remove your profile and sign-in credentials</li>
            <li>Sign you out of all sessions immediately</li>
            <li>This is permanent and cannot be reversed</li>
          </ul>
        </div>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger
            render={
              <Button
                variant="destructive"
                className="self-start"
                onClick={() => {
                  setConfirmInput('')
                  setError(null)
                }}
              />
            }
          >
            <TrashIcon className="size-4" aria-hidden="true" />
            Delete my account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account and anonymize all your
                submissions. You will be signed out immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="flex flex-col gap-2 py-2">
              <Label htmlFor="delete-confirm-input">
                Type{' '}
                <span className="font-mono font-bold">{CONFIRMATION_TEXT}</span>{' '}
                to confirm
              </Label>
              <Input
                id="delete-confirm-input"
                type="text"
                autoComplete="off"
                placeholder={CONFIRMATION_TEXT}
                value={confirmInput}
                onChange={(e) => {
                  setConfirmInput(e.target.value)
                  if (error) setError(null)
                }}
                disabled={isDeleting}
                aria-describedby={error ? 'delete-error' : undefined}
              />
              {error && (
                <p
                  id="delete-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={!isConfirmed || isDeleting}
                onClick={(e) => {
                  e.preventDefault()
                  void handleDelete()
                }}
              >
                {isDeleting ? 'Deleting\u2026' : 'Delete my account permanently'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card >
  )
}
