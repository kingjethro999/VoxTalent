export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border">
      <div className="text-2xl font-bold">VoxTalent</div>
      <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">Credits</button>
    </header>
  )
}
