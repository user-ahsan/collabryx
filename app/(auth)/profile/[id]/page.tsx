export default function ProfilePage({ params }: { params: { id: string } }) {
    return (
        <div className="container py-10">
            <h1 className="text-3xl font-bold mb-6">Profile {params.id}</h1>
            <p className="text-muted-foreground">User profile details...</p>
        </div>
    )
}
