
"use client";

import React, { useState, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VolumeCurveEditor from './VolumeCurveEditor';
import { PlusCircle, Edit3, Trash2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfileManager: React.FC = () => {
  const { profiles, activeProfileId, setActiveProfileId, addProfile, updateProfile, deleteProfile, getProfileById } = useAppContext();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [profileToEdit, setProfileToEdit] = useState<Profile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<Profile | null>(null);

  const handleAddProfile = () => {
    if (newProfileName.trim() === '') {
      alert('Profile name cannot be empty.');
      return;
    }
    const newProf = addProfile(newProfileName);
    setActiveProfileId(newProf.id);
    setNewProfileName('');
    setIsAddDialogOpen(false);
    setProfileToEdit(newProf); // Open edit dialog for the new profile to configure its curve
    setIsEditDialogOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setProfileToEdit(profile);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProfile = (updatedProfile: Profile) => {
    updateProfile(updatedProfile);
    setIsEditDialogOpen(false);
    setProfileToEdit(null);
  };

  const handleDeleteConfirmation = (profile: Profile) => {
    setProfileToDelete(profile);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteProfile = () => {
    if (profileToDelete) {
      deleteProfile(profileToDelete.id);
      setIsDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  const activeProfile = getProfileById(activeProfileId);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold text-foreground">
          <Settings className="mr-2 h-6 w-6 text-primary" />
          Profile Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="active-profile-select" className="text-md font-medium">Active Profile</Label>
          <Select value={activeProfileId || ''} onValueChange={(value) => setActiveProfileId(value)}>
            <SelectTrigger id="active-profile-select" className="w-full">
              <SelectValue placeholder="Select a profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeProfile && (
          <div className="space-x-2 flex justify-end">
            <Button variant="outline" onClick={() => handleEditProfile(activeProfile)} className="text-primary border-primary hover:bg-primary hover:text-primary-foreground">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Current
            </Button>
            {profiles.length > 1 && (
                 <Button variant="destructive" onClick={() => handleDeleteConfirmation(activeProfile)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Current
                </Button>
            )}
          </div>
        )}
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Profile
        </Button>

        {/* Add Profile Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Profile</DialogTitle>
              <DialogDescription>Enter a name for your new profile.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="new-profile-name">Profile Name</Label>
              <Input
                id="new-profile-name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g., Motorcycle, Boat"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddProfile} className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Profile</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if(!open) setProfileToEdit(null);}}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile: {profileToEdit?.name}</DialogTitle>
              <DialogDescription>Adjust the volume curve and settings for this profile.</DialogDescription>
            </DialogHeader>
            {profileToEdit && (
              <VolumeCurveEditor
                profile={profileToEdit}
                onProfileUpdate={handleUpdateProfile}
              />
            )}
            {/* Footer is part of VolumeCurveEditor's CardFooter now */}
          </DialogContent>
        </Dialog>

        {/* Delete Profile Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Profile: {profileToDelete?.name}?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. Are you sure you want to delete this profile?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button variant="destructive" onClick={handleDeleteProfile}>Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </CardContent>
    </Card>
  );
};

export default ProfileManager;
