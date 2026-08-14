import './style.css'

// Direct Endpoint based on your API Gateway URL
const API_URL = 'https://iq1veb8vef.execute-api.us-east-1.amazonaws.com/prod/tasks'

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

// Inject Layout into App Root
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="header-row">
      <div>
        <h1>🚀 Project Launch Pad</h1>
        <p class="subtitle">AWS Lambda + DynamoDB Cloud Backend</p>
      </div>
    </div>

    <div id="error-banner" style="display:none; background:#ef4444; color:#fff; padding:0.6rem; border-radius:6px; margin-bottom:1rem; font-size:0.85rem;"></div>

    <form id="task-form">
      <div class="input-group">
        <input type="text" id="task-input" placeholder="Enter task title..." required />
      </div>

      <div class="meta-group">
        <select id="priority-select">
          <option value="low">🟢 Low</option>
          <option value="medium" selected>🟡 Medium</option>
          <option value="high">🔴 High</option>
        </select>
        <select id="category-select">
          <option value="work" selected>💼 Work</option>
          <option value="personal">👤 Personal</option>
          <option value="urgent">⚡ Urgent</option>
        </select>
        <button type="submit" id="add-btn">Add Task</button>
      </div>
    </form>

    <ul id="task-list"></ul>
  </div>
`

// DOM Elements
const form = document.getElementById('task-form') as HTMLFormElement
const input = document.getElementById('task-input') as HTMLInputElement
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
const categorySelect = document.getElementById('category-select') as HTMLSelectElement
const list = document.getElementById('task-list') as HTMLUListElement
const errorBanner = document.getElementById('error-banner') as HTMLDivElement

function showError(msg: string) {
  errorBanner.style.display = 'block'
  errorBanner.textContent = `⚠️ Error: ${msg}`
}

function clearError() {
  errorBanner.style.display = 'none'
  errorBanner.textContent = ''
}

// 1. GET Request: Fetch tasks from API Gateway
async function fetchTasks() {
  clearError()
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to retrieve tasks`)
    const data = await res.json()
    tasks = Array.isArray(data) ? data : (data.Items || [])
    renderTasks()
  } catch (err: any) {
    showError(err.message || 'Failed to connect to backend')
  }
}

// 2. Render tasks array to screen
function renderTasks() {
  list.innerHTML = ''
  tasks.forEach((task) => {
    const li = document.createElement('li')
    li.className = task.completed ? 'completed' : ''
    
    const priorityIcon = task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'
    const categoryIcon = task.category === 'urgent' ? '⚡' : task.category === 'personal' ? '👤' : '💼'

    li.innerHTML = `
      <div class="task-content">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')" />
        <span>${task.text}</span>
        <span class="badge">${priorityIcon} ${task.priority}</span>
        <span class="badge">${categoryIcon} ${task.category}</span>
      </div>
      <button class="delete-btn" onclick="removeTask('${task.id}')">❌</button>
    `
    list.appendChild(li)
  })
}

// 3. POST Request: Submit task without reloading page
form.addEventListener('submit', async (e: Event) => {
  e.preventDefault()
  
  const taskText = input.value.trim()
  if (!taskText) return
  clearError()

  const newTask: Task = {
    id: Date.now().toString(),
    text: taskText,
    completed: false,
    priority: prioritySelect.value as Priority,
    category: categorySelect.value as Category,
    createdAt: Date.now()
  }

  // Optimistic UI update
  tasks.push(newTask)
  renderTasks()
  input.value = ''

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}: Could not save task`)
    await fetchTasks()
  } catch (err: any) {
    showError(err.message)
    tasks = tasks.filter((t) => t.id !== newTask.id)
    renderTasks()
  }
})

// 4. PUT/POST Request: Toggle completion state
;(window as any).toggleTask = async (id: string) => {
  clearError()
  const task = tasks.find((t) => t.id === id)
  if (!task) return

  task.completed = !task.completed
  renderTasks()

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Toggle failed`)
  } catch (err: any) {
    showError(err.message)
    task.completed = !task.completed
    renderTasks()
  }
}

// 5. DELETE Request: Remove task
;(window as any).removeTask = async (id: string) => {
  clearError()
  const previousTasks = [...tasks]
  tasks = tasks.filter((t) => t.id !== id)
  renderTasks()

  try {
    const res = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Delete failed`)
  } catch (err: any) {
    showError(err.message)
    tasks = previousTasks
    renderTasks()
  }
}

// Initial fetch on page load
fetchTasks()