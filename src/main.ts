import './style.css'

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

// Dashboard Layout with Sidebar, Header & Content Grid
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="dashboard-layout">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">Project Launch Pad</span>
      </div>
      <nav class="sidebar-menu">
        <a href="#" class="nav-item active"><span class="nav-icon">📋</span> Dashboard</a>
        <a href="#" class="nav-item"><span class="nav-icon">📊</span> Metrics</a>
        <a href="#" class="nav-item"><span class="nav-icon">📁</span> Projects</a>
        <a href="#" class="nav-item"><span class="nav-icon">☁️</span> AWS Services</a>
        <a href="#" class="nav-item"><span class="nav-icon">⚙️</span> Settings</a>
      </nav>
      <div class="sidebar-footer">
        <div class="user-avatar">👤</div>
        <div class="user-info">
          <span class="user-name">Developer Admin</span>
          <span class="user-role">AWS Cloud Architect</span>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="top-nav">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="task-search" placeholder="Search tasks, parameters, or logs..." />
        </div>
        <div class="top-actions">
          <button class="icon-btn" title="Notifications">🔔</button>
          <button class="btn btn-outline">Documentation</button>
          <div class="account-pill">
            <span class="status-dot"></span>
            <span>Cloud Connected</span>
          </div>
        </div>
      </header>

      <section class="workspace">
        <div class="page-title-row">
          <div>
            <h2>Project Launch Pad</h2>
            <p class="subtitle">Real-time AWS Lambda + DynamoDB Cloud Pipeline Engine</p>
          </div>
        </div>

        <div id="error-banner" class="alert alert-error" style="display: none;"></div>

        <div class="creator-card">
          <div class="creator-header">
            <h3>Quick Task Dispatcher</h3>
          </div>
          <div class="creator-body">
            <div class="form-row">
              <input type="text" id="task-input" class="form-control" placeholder="Enter task title or API command (e.g., Verify AWS Integration)..." />
              <button type="button" id="add-btn" class="btn btn-primary">Dispatch Task</button>
            </div>
            <div class="form-meta-row">
              <div class="meta-field">
                <label>Priority</label>
                <select id="priority-select" class="form-select">
                  <option value="low">🟢 Low</option>
                  <option value="medium" selected>🟡 Medium</option>
                  <option value="high">🔴 High</option>
                </select>
              </div>
              <div class="meta-field">
                <label>Category</label>
                <select id="category-select" class="form-select">
                  <option value="work" selected>💼 Work</option>
                  <option value="personal">👤 Personal</option>
                  <option value="urgent">⚡ Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="task-list-header">
          <span class="count-badge" id="task-count">0 Tasks Staged</span>
        </div>
        <div id="task-card-container" class="task-grid"></div>
      </section>
    </main>
  </div>
`

// DOM Elements
const input = document.getElementById('task-input') as HTMLInputElement
const searchInput = document.getElementById('task-search') as HTMLInputElement
const prioritySelect = document.getElementById('priority-select') as HTMLSelectElement
const categorySelect = document.getElementById('category-select') as HTMLSelectElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const taskGrid = document.getElementById('task-card-container') as HTMLDivElement
const taskCount = document.getElementById('task-count') as HTMLSpanElement
const errorBanner = document.getElementById('error-banner') as HTMLDivElement

function showError(msg: string) {
  errorBanner.style.display = 'block'
  errorBanner.textContent = `⚠️ Runtime Alert: ${msg}`
}

function clearError() {
  errorBanner.style.display = 'none'
  errorBanner.textContent = ''
}

// Render task list into styled wide dashboard cards
function renderTasks(filterQuery: string = '') {
  taskGrid.innerHTML = ''

  if (!Array.isArray(tasks)) {
    tasks = []
  }

  const filteredTasks = tasks.filter(t => 
    t.text.toLowerCase().includes(filterQuery.toLowerCase())
  )

  taskCount.textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? 'Task' : 'Tasks'} Synchronized`

  if (filteredTasks.length === 0) {
    taskGrid.innerHTML = `
      <div class="empty-state">
        <p>No active cloud tasks found. Use the Dispatcher above to add your first item.</p>
      </div>
    `
    return
  }

  filteredTasks.forEach((task) => {
    const card = document.createElement('div')
    card.className = `task-card ${task.completed ? 'completed' : ''}`

    const priorityClass = `pill-priority-${task.priority}`
    const categoryClass = `pill-category-${task.category}`
    const jsonSnippet = JSON.stringify({ text: task.text, priority: task.priority, category: task.category }, null, 2)

    card.innerHTML = `
      <div class="card-left">
        <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} id="check-${task.id}" />
        <div class="task-detail-block">
          <div class="task-title-line">
            <span class="task-title-text">${task.text}</span>
            <span class="status-pill ${task.completed ? 'pill-done' : 'pill-active'}">${task.completed ? 'Done' : 'Active'}</span>
          </div>
          <pre class="task-json-snippet"><code>${jsonSnippet}</code></pre>
        </div>
      </div>

      <div class="card-right">
        <div class="pill-group">
          <div class="meta-pill-block">
            <span class="pill-label">Priority</span>
            <span class="meta-pill ${priorityClass}">${task.priority.toUpperCase()}</span>
          </div>
          <div class="meta-pill-block">
            <span class="pill-label">Category</span>
            <span class="meta-pill ${categoryClass}">${task.category.toUpperCase()}</span>
          </div>
        </div>
        <button class="delete-icon-btn" id="del-${task.id}" title="Delete Record">🗑️</button>
      </div>
    `

    const checkbox = card.querySelector(`#check-${task.id}`) as HTMLInputElement
    checkbox.addEventListener('change', () => toggleTask(task.id))

    const deleteBtn = card.querySelector(`#del-${task.id}`) as HTMLButtonElement
    deleteBtn.addEventListener('click', () => removeTask(task.id))

    taskGrid.appendChild(card)
  })
}

// API: Fetch tasks from API Gateway
async function fetchTasks() {
  clearError()
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to retrieve database records`)
    const data = await res.json()
    
    if (Array.isArray(data)) {
      tasks = data
    } else if (data && Array.isArray(data.Items)) {
      tasks = data.Items
    } else {
      tasks = []
    }
    renderTasks(searchInput.value)
  } catch (err: any) {
    showError(err.message || 'Error connecting to AWS API Gateway')
  }
}

// API: Add task
async function handleAddTask() {
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

  tasks.unshift(newTask)
  renderTasks(searchInput.value)
  input.value = ''

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Could not write to DynamoDB`)
    await fetchTasks()
  } catch (err: any) {
    showError(err.message)
    tasks = tasks.filter((t) => t.id !== newTask.id)
    renderTasks(searchInput.value)
  }
}

addBtn.addEventListener('click', handleAddTask)
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAddTask()
})

searchInput.addEventListener('input', (e) => {
  renderTasks((e.target as HTMLInputElement).value)
})

// API: Toggle completion
async function toggleTask(id: string) {
  clearError()
  const task = tasks.find((t) => t.id === id)
  if (!task) return

  task.completed = !task.completed
  renderTasks(searchInput.value)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Update sync failed`)
  } catch (err: any) {
    showError(err.message)
    task.completed = !task.completed
    renderTasks(searchInput.value)
  }
}

// API: Delete task
async function removeTask(id: string) {
  clearError()
  const previousTasks = [...tasks]
  tasks = tasks.filter((t) => t.id !== id)
  renderTasks(searchInput.value)

  try {
    const res = await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}: Delete request failed`)
  } catch (err: any) {
    showError(err.message)
    tasks = previousTasks
    renderTasks(searchInput.value)
  }
}

fetchTasks()