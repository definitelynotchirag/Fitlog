'use client'
import { SignIn } from '@clerk/nextjs'
import React from 'react'

const login = () => {
  return (
    <div>
      <SignIn routing='hash' signUpUrl='/signup'/>
    </div>
  )
}

export default login