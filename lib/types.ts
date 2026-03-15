// ============================================================
// Types — chaque interface correspond à une table Supabase.
// Ces types décrivent la forme des données qu'on reçoit et envoie.
// ============================================================

// Table "lists" — une liste (ex: "Courses", "Bricolage")
export interface List {
  id: string          // identifiant unique généré par Supabase
  name: string        // nom affiché
  owner_id: string    // id de l'utilisateur qui a créé la liste
  created_at: string  // date ISO générée automatiquement par Supabase
  updated_at: string  // date ISO mise à jour automatiquement par Supabase
}

// Table "tasks" — un item dans une liste
export interface Task {
  id: string          // identifiant unique
  list_id: string     // clé étrangère vers la liste parente
  content: string     // texte de la tâche
  completed: boolean  // cochée ou non
  position: number    // ordre d'affichage dans la liste
  created_by: string  // id de l'utilisateur qui a ajouté la tâche
  created_at: string
  updated_at: string
}
