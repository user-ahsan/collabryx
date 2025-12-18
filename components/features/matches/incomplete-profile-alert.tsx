"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, User } from "lucide-react"

interface IncompleteProfileAlertProps {
    onCompleteProfile?: () => void
}

export function IncompleteProfileAlert({ onCompleteProfile }: IncompleteProfileAlertProps) {
    return (
        <Alert variant="default" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 mb-6">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="ml-8">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-foreground mb-1">
                            Complete your profile to unlock AI-powered recommendations
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Add your skills, bio, and project details to help us find better matches.
                        </p>
                    </div>
                    <Button
                        onClick={onCompleteProfile}
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
                    >
                        <User className="mr-2 h-4 w-4" />
                        Complete Profile
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    )
}
