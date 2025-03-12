import { useEffect, useState } from 'react'

function App() {
  const [hello, setHello] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/').then(async (res) => {
      const txt = await res.text()
      console.log(txt)
      setHello(txt)
    })
  })

  return <>
    <h1 className='text-red-500'>{hello}</h1>
  </>
}

export default App
