'use client'

import { useEffect, useState, useRef } from 'react'
import { Pet } from './pet'
import { PetAdoptionDialog } from './pet-adoption-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePetName, feedPet } from '@/actions/gamification'
import { toast } from 'sonner'
import { Edit2, Check, X, Loader2, Heart } from 'lucide-react'

interface PetData {
  petType: string | null
  petName: string | null
  petLevel: number
  petHappiness: number
  petLastFed: Date | null
}

export function PetDisplay() {
  const [petData, setPetData] = useState<PetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [adoptionDialogOpen, setAdoptionDialogOpen] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [feeding, setFeeding] = useState(false)
  const wasDialogOpenRef = useRef(false)

  const fetchPet = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gamification/pet')
      if (!res.ok) {
        throw new Error('Failed to fetch pet')
      }
      const data = await res.json()
      setPetData(data)
    } catch (error) {
      console.error('Error fetching pet:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPet()
  }, [])

  // Refresh pet data when dialog closes (in case pet was adopted)
  useEffect(() => {
    if (adoptionDialogOpen) {
      wasDialogOpenRef.current = true
    } else if (wasDialogOpenRef.current) {
      // Dialog was open and now closed - refresh pet data
      const timer = setTimeout(() => {
        fetchPet()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [adoptionDialogOpen])

  async function handleSaveName() {
    if (!newPetName.trim()) {
      toast.error('Tên pet không được để trống')
      return
    }

    setSavingName(true)
    try {
      const result = await updatePetName(newPetName.trim())
      if (result.success) {
        toast.success('Đã cập nhật tên pet!')
        setIsEditingName(false)
        fetchPet() // Refresh pet data
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setSavingName(false)
    }
  }

  function handleCancelEdit() {
    setIsEditingName(false)
    setNewPetName('')
  }

  async function handleFeedPet() {
    setFeeding(true)
    try {
      const result = await feedPet()
      if (result.success) {
        toast.success(`Pet đã được cho ăn! Happiness: ${result.happiness}%`)
        fetchPet() // Refresh pet data
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra')
    } finally {
      setFeeding(false)
    }
  }

  // Calculate happiness status
  const getHappinessStatus = (happiness: number) => {
    if (happiness >= 80) return { emoji: '😊', text: 'Rất vui', color: 'from-green-400 to-green-600' }
    if (happiness >= 60) return { emoji: '🙂', text: 'Vui', color: 'from-yellow-400 to-yellow-600' }
    if (happiness >= 40) return { emoji: '😐', text: 'Bình thường', color: 'from-orange-400 to-orange-600' }
    if (happiness >= 20) return { emoji: '😟', text: 'Buồn', color: 'from-red-400 to-red-600' }
    return { emoji: '😢', text: 'Rất buồn', color: 'from-red-600 to-red-800' }
  }

  const happinessStatus = petData ? getHappinessStatus(petData.petHappiness) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading pet...</div>
      </div>
    )
  }

  if (!petData?.petType) {
    return (
      <>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="text-gray-500 text-center">
            <p className="text-lg mb-2">Chưa có thú cưng</p>
            <p className="text-sm mb-4">Nhận nuôi một thú cưng để bắt đầu!</p>
          </div>
          <Button
            onClick={() => setAdoptionDialogOpen(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            🐾 Nhận nuôi Pet
          </Button>
        </div>
        <PetAdoptionDialog
          open={adoptionDialogOpen}
          onOpenChange={setAdoptionDialogOpen}
        />
      </>
    )
  }

  return (
    <div className="pet-container">
      <div className="pet-avatar flex justify-center mb-4">
        <Pet
          type={petData.petType}
          name={petData.petName || 'Unnamed Pet'}
          level={petData.petLevel}
          happiness={petData.petHappiness}
          size={120}
        />
      </div>
      <div className="pet-info text-center space-y-2">
        {/* Pet Name - Editable */}
        {isEditingName ? (
          <div className="flex items-center justify-center gap-2">
            <Input
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="Nhập tên pet..."
              maxLength={20}
              className="max-w-[200px] text-center"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName()
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSaveName}
              disabled={savingName || !newPetName.trim()}
              className="h-8 w-8 p-0"
            >
              {savingName ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              disabled={savingName}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">{petData.petName}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setNewPetName(petData.petName || '')
                setIsEditingName(true)
              }}
              className="h-6 w-6 p-0 hover:bg-gray-100"
              title="Đổi tên pet"
            >
              <Edit2 className="h-3 w-3 text-gray-500" />
            </Button>
          </div>
        )}
        <p className="text-sm text-gray-600">Level {petData.petLevel}</p>
        <div className="happiness-bar max-w-xs mx-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600 flex items-center gap-1">
              {happinessStatus?.emoji} Happiness
            </span>
            <span className="text-xs font-medium text-gray-700">
              {petData.petHappiness}% {happinessStatus?.text}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${happinessStatus?.color || 'from-green-400 to-green-600'} transition-all duration-500`}
              style={{ width: `${petData.petHappiness}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={handleFeedPet}
            disabled={feeding}
            className="flex items-center gap-1"
          >
            {feeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className="h-4 w-4 text-red-500" />
            )}
            Cho ăn
          </Button>
          {petData.petLastFed && (
            <p className="text-xs text-gray-500">
              Cho ăn lần cuối: {new Date(petData.petLastFed).toLocaleString('vi-VN', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

