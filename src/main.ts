import './style.css'

// ⚠️ REPLACE WITH YOUR API GATEWAY URL FROM STEP 4
const API_URL = 'https://iq1veb8vef.execute-api.us-east-1.amazonaws.com/prods'


type Priority = 'low' | 'medium' | 'high'
type Category = 'work' | 'personal' | 'urgent'

interface Task {
  id: string
  text: string
  completed: boolean
  priority: Priority
  category: Category
  createdAt: number
}

let tasks: Task[] = []

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header-row">
      <div>
        <h1>🚀 Project Launch Pad</h1>
        <p class="subtitle">AWS Lambda + DynamoDB Cloud Backend</p>
      </div>
    </div>

    <div class="input-group">
      <input type="text" id="task-input" placeholder="Enter task title..." />
    </div>

    <div class="meta-group">
      <select id="priority-select">
        <option value="low">🟢 Low</option>
        <option value="medium" selected>🟡 Medium</option>
        <option value="high">🔴 High</option>
      </select>
      <select id="category-select">
        <option value="work">💼 Work</option>
        <option value="personal">👤 Personal</option>
        <option value="urgent">⚡ Urgent</option>
      </select>
      <button id="add-btn">Add Task</button>
    </div>

    <ul id="task-list"></ul>
  </div>
`

const input = document.getElementById('task-input') as HTMLInputElement
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
const categorySelect = document.getElementById('category-select') as HTMLSelectElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const list = document.getElementById('task-list') as HTMLUListElement

// API CALLS
async function fetchTasks() {
  try {
    const res = await fetch(API_URL)
    tasks = await res.json()
    renderTasks()
  } catch (err) {
    console.error("Failed to load tasks", err)
  }
}

async function renderTasks() {
  list.innerHTML = ''
  tasks.forEach((task) => {
    const li = document.createElement('li')
    li.className = task.completed ? 'completed' : ''
    li.innerHTML = `
      <div class="task-content">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" />
        <span>${task.text}</span>
      </div>
      <button class="delete-btn" onclick="removeTask('${task.id}')">❌</button>
    `
    list.appendChild(li)
  })
}

addBtn.addEventListener('click', async () => {
  if (input.value.trim()) {
    const newTask: Task = {
      id: Date.now().toString(),
      text: input.value.trim(),
      completed: false,
      priority: prioritySelect.value as Priority,
      category: categorySelect.value as Category,
      createdAt: Date.now()
    }

    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })

    input.value = ''
    fetchTasks()
  }
})

;(window as any).toggleTask = async (id: string) => {
  const task = tasks.find(t => t.id === id)
  if (task) {
    task.completed = !task.completed
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    })
    fetchTasks()
  }
}

;(window as any).removeTask = async (id: string) => {
  await fetch(API_URL, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  })
  fetchTasks()
}

fetchTasks()