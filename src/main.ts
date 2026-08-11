import './style.css'

interface Task {
  id: string
  text: string
  completed: boolean
}

let tasks: Task[] = JSON.parse(localStorage.getItem('tasks') || '[]')
let currentFilter: 'all' | 'active' | 'completed' = 'all'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <h1>🚀 Project Launch Pad</h1>
    <p class="subtitle">Live AWS CloudFront Deployment Test</p>
    
    <div class="input-group">
      <input type="text" id="task-input" placeholder="Enter a new task..." />
      <button id="add-btn">Add Task</button>
    </div>

    <div class="filter-group">
      <button class="filter-btn active" data-filter="all">All</button>
      <button class="filter-btn" data-filter="active">Active</button>
      <button class="filter-btn" data-filter="completed">Completed</button>
    </div>

    <ul id="task-list"></ul>
  </div>
`

const input = document.getElementById('task-input') as HTMLInputElement
const addBtn = document.getElementById('add-btn') as HTMLButtonElement
const list = document.getElementById('task-list') as HTMLUListElement
const filterBtns = document.querySelectorAll<HTMLButtonElement>('.filter-btn')

function renderTasks() {
  list.innerHTML = ''
  
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'active') return !task.completed
    if (currentFilter === 'completed') return task.completed
    return true
  })

  filteredTasks.forEach((task) => {
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

  localStorage.setItem('tasks', JSON.stringify(tasks))
}

addBtn.addEventListener('click', () => {
  if (input.value.trim()) {
    tasks.push({
      id: Date.now().toString(),
      text: input.value.trim(),
      completed: false
    })
    input.value = ''
    renderTasks()
  }
})

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    currentFilter = btn.dataset.filter as 'all' | 'active' | 'completed'
    renderTasks()
  })
})

;(window as any).toggleTask = (id: string) => {
  tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
  renderTasks()
}

;(window as any).removeTask = (id: string) => {
  tasks = tasks.filter(t => t.id !== id)
  renderTasks()
}

renderTasks()