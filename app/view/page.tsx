import { redirect } from 'next/navigation'

export default function ViewPage() {
  // Redirect to CV selection if no template is specified
  redirect('/cv-select')
}

