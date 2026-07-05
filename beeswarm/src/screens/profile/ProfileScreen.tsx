import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import {
  BeekeeperProfile,
  changePassword,
  fetchProfile,
  updateProfile,
} from "../../api";
import { THEME } from "../../theme";
import { useTheme } from "../../hooks/useTheme";
import { createProfileStyles } from "./ProfileScreen.styles";
import { Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
  
type Props = {
  onLogout: () => void;
  onOpenSettings: () => void;
  currentUser: BeekeeperProfile | null;
  onProfileUpdate: (user: BeekeeperProfile) => void;
};

export function ProfileScreen({
  onLogout,
  onOpenSettings,
  currentUser,
  onProfileUpdate,
}: Props) {
  const [full_name, setFullName] = useState(currentUser?.full_name ?? "Beekeeper");
  //const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState(currentUser?.email ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [address, setAddress] = useState(currentUser?.address ?? "");
  const [apiKey, setApiKey] = useState(currentUser?.api_key ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!currentUser);
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profile_photo_url ?? "");
  
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name);
      setEmail(currentUser.email ?? "");
      setPhone(currentUser.phone);
      setAddress(currentUser.address ?? "");
      setApiKey(currentUser.api_key ?? "");
      return;
    }
    void (async () => {
      try {
        const profile = await fetchProfile();
        setFullName(profile.full_name || "");
        setEmail(profile.email ?? "");
        setPhone(profile.phone);
        setAddress(profile.address ?? "");
        setApiKey(profile.api_key ?? "");
        onProfileUpdate(profile);
      } catch {
        Toast.show({ type: "error", text1: "Could not load profile" });
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser, onProfileUpdate]);
  console.log("PROFILE FROM API:", currentUser?.full_name);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({
        full_name,
        email,
        phone,
        address,
        api_key: apiKey,
        profile_photo_url: profilePhoto,
        // server_url omitted — Railway URL is the fixed backend
      });
      onProfileUpdate(updated);
      setEditing(false);
      Toast.show({ type: "success", text1: "Profile saved" });
    } catch {
      Toast.show({ type: "error", text1: "Could not save profile" });
    } finally {
      setSaving(false);
    }
  };

  const theme = useTheme();
  const styles = useMemo(() => createProfileStyles(theme), [theme]);

  // ── Change Password modal state ──────────────────────────────────────────────
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const openPasswordModal = () => {
    setCurrentPw(""); setNewPw(""); setConfirmPw(""); setPwError("");
    setPwModalVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPw) { setPwError("Current password is required."); return; }
    if (!newPw) { setPwError("New password is required."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (newPw === currentPw) { setPwError("New password must differ from your current password."); return; }
    setPwError("");
    setPwSaving(true);
    try {
      await changePassword(currentPw, newPw);
      setPwModalVisible(false);
      Toast.show({ type: "success", text1: "Password changed successfully" });
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change password. Check your current password.");
    } finally {
      setPwSaving(false);
    }
  };

  // const initials = full_name
  //   .trim()
  //   .split(" ")
  //   .slice(0, 2)
  //   .map((w) => w[0]?.toUpperCase() ?? "")
  //   .join("");

    const initials = (full_name || "Beekeeper")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w?.[0]?.toUpperCase() ?? "")
    .join("");

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={THEME.accent} />
        <Text style={styles.stateText}>Loading profile…</Text>
      </View>
    );
  }


  // Allow user to pick a profile photo from their device
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0].uri);
    }
  };
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.page }}
      contentContainerStyle={styles.profilePage}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      {/* <View style={styles.profileHeroCard}>
        <View style={styles.profileAvatarCircle}>
          <Text style={styles.profileAvatarInitials}>{initials || "BK"}</Text>
        </View> */}
     
      <View style={styles.profileHeroCard}>
      <Pressable onPress={pickImage}>
        <View style={styles.profileAvatarCircle}>
          {profilePhoto ? (
            <Image
              source={{ uri: profilePhoto }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
              }}
            />
          ) : (
            <Text style={styles.profileAvatarInitials}>
              {initials || "BK"}
            </Text>
          )}
        </View>

        <Text style={{ textAlign: "center", color: THEME.primary, marginTop: 4 }}>
          Change Photo
        </Text>
      </Pressable>
      
      {/* {editing ? (
        <TextInput
          id="profile-name"
          style={styles.profileNameInput}
          value={full_name}
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor={THEME.placeholder}
        />
      ) : (
        <Text style={styles.profileHeroName}>{full_name}</Text>
      )}
        {/* <Text style={styles.profileHeroRole}>Beekeeper</Text> */}
        

          {editing ? (
        <TextInput
          id="profile-name"
          style={styles.profileNameInput}
          value={full_name}
          onChangeText={setFullName}
          placeholder="Full name"
          placeholderTextColor={THEME.placeholder}
        />
      ) : (
            <Text style={styles.profileHeroName}>{full_name}</Text>
        )}
        
    </View>

      {/* Contact Info */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Contact Information</Text>

        <View style={styles.profileFieldRow}>
          <Ionicons
            name="mail-outline"
            size={18}
            color={THEME.textMuted}
            style={styles.profileFieldIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileFieldLabel}>Email</Text>
            {editing ? (
              <TextInput
                id="profile-email"
                style={styles.profileFieldInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email address"
                placeholderTextColor={THEME.placeholder}
              />
            ) : (
              <Text style={styles.profileFieldValue}>{email || "—"}</Text>
            )}
          </View>
        </View>
        <View style={styles.profileDivider} />

        <View style={styles.profileFieldRow}>
          <Ionicons
            name="call-outline"
            size={18}
            color={THEME.textMuted}
            style={styles.profileFieldIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileFieldLabel}>Phone</Text>
            {editing ? (
              <TextInput
                id="profile-phone"
                style={styles.profileFieldInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Phone number"
                placeholderTextColor={THEME.placeholder}
              />
            ) : (
              <Text style={styles.profileFieldValue}>{phone || "—"}</Text>
            )}
          </View>
        </View>
        <View style={styles.profileDivider} />

        <View style={styles.profileFieldRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={THEME.textMuted}
            style={styles.profileFieldIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.profileFieldLabel}>Address</Text>
            {editing ? (
              <TextInput
                id="profile-address"
                style={styles.profileFieldInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Your address"
                placeholderTextColor={THEME.placeholder}
              />
            ) : (
              <Text style={styles.profileFieldValue}>{address || "—"}</Text>
            )}
          </View>
        </View>
        {/* <View style={styles.profileDivider} />

        <View style={styles.profileFieldRow}>
          <Ionicons
            name="key-outline"
            size={18}
            color={THEME.textMuted}
            style={styles.profileFieldIcon}
          /> */}
          {/* <View style={{ flex: 1 }}>
            <Text style={styles.profileFieldLabel}>API Key</Text>
            {editing ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  id="profile-api-key"
                  style={[styles.profileFieldInput, { flex: 1 }]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Enter API key"
                  placeholderTextColor={THEME.placeholder}
                  secureTextEntry={!showApiKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowApiKey((v) => !v)}
                  style={{ paddingLeft: 8 }}
                >
                  <Ionicons
                    name={showApiKey ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={THEME.textMuted}
                  />
                </Pressable>
              </View>
            ) : (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Text style={styles.profileFieldValue}>
                  {apiKey ? (showApiKey ? apiKey : "••••••••••••••••") : "—"}
                </Text>
                {apiKey !== "" && (
                  <Pressable onPress={() => setShowApiKey((v) => !v)}>
                    <Ionicons
                      name={showApiKey ? "eye-off-outline" : "eye-outline"}
                      size={16}
                      color={THEME.textMuted}
                    />
                  </Pressable>
                )}
              </View>
            )}
          </View> */}
        {/* </View>
        <View style={styles.profileDivider} /> */}

        {/* Server URL is fixed (Railway) — not shown to end users */}
      </View>

      {/* Edit / Save row */}
      {editing ? (
        <View style={styles.profileActionsRow}>
          <Pressable
            style={styles.profileSecondaryBtn}
            onPress={() => setEditing(false)}
          >
            <Text style={styles.profileSecondaryBtnText}>Cancel</Text>
          </Pressable>
          <Pressable
            style={[styles.profilePrimaryBtn, saving && { opacity: 0.6 }]}
            onPress={() => void handleSave()}
            disabled={saving}
          >
            <Text style={styles.profilePrimaryBtnText}>
              {saving ? "Saving…" : "Save Changes"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={styles.profileEditBtn}
          onPress={() => setEditing(true)}
        >
          <Ionicons name="create-outline" size={16} color={THEME.primary} />
          <Text style={styles.profileEditBtnText}>Edit Profile</Text>
        </Pressable>
      )}

      {/* Quick links */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>App</Text>

        <Pressable style={styles.profileLinkRow} onPress={onOpenSettings}>
          <Ionicons name="settings-outline" size={20} color={THEME.primary} />
          <Text style={styles.profileLinkText}>Settings</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.textMuted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <View style={styles.profileDivider} />

        <Pressable
          style={styles.profileLinkRow}
          onPress={openPasswordModal}
        >
          <Ionicons name="lock-closed-outline" size={20} color={THEME.primary} />
          <Text style={styles.profileLinkText}>Change Password</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.textMuted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
        <View style={styles.profileDivider} />

        <Pressable
          style={styles.profileLinkRow}
          onPress={() =>
            Toast.show({ type: "info", text1: "Help & support coming soon" })
          }
        >
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={THEME.primary}
          />
          <Text style={styles.profileLinkText}>Help & Support</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.textMuted}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      </View>

      {/* Sign out */}
      <Pressable style={styles.profileLogoutBtn} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={18} color="#B42318" />
        <Text style={styles.profileLogoutText}>Sign Out</Text>
      </Pressable>

<Text style={styles.profileVersion}>Beeswarm v1.0.0</Text>

       {/* Change Password Modal */}
       <Modal
         visible={pwModalVisible}
         transparent
         animationType="fade"
         onRequestClose={() => setPwModalVisible(false)}
       >
         <View style={styles.pwModalOverlay}>
           <View style={styles.pwModalCard}>
             <View style={styles.pwModalHeader}>
               <Text style={styles.pwModalTitle}>Change Password</Text>
               <Pressable onPress={() => setPwModalVisible(false)} style={styles.pwModalCloseBtn}>
                 <Ionicons name="close" size={20} color={theme.textMuted} />
               </Pressable>
             </View>

             <View style={styles.pwModalField}>
               <Text style={styles.pwModalLabel}>Current Password</Text>
               <View style={styles.pwModalInputRow}>
                 <TextInput
                   style={styles.pwModalInput}
                   value={currentPw}
                   onChangeText={setCurrentPw}
                   secureTextEntry={!showCurrentPw}
                   placeholder="Enter current password"
                   placeholderTextColor={theme.placeholder}
                 />
                 <Pressable onPress={() => setShowCurrentPw((v) => !v)}>
                   <Ionicons name={showCurrentPw ? "eye-off" : "eye"} size={18} color={theme.textMuted} />
                 </Pressable>
               </View>
             </View>

             <View style={styles.pwModalField}>
               <Text style={styles.pwModalLabel}>New Password</Text>
               <View style={styles.pwModalInputRow}>
                 <TextInput
                   style={styles.pwModalInput}
                   value={newPw}
                   onChangeText={setNewPw}
                   secureTextEntry={!showNewPw}
                   placeholder="Enter new password (min 8 chars)"
                   placeholderTextColor={theme.placeholder}
                 />
                 <Pressable onPress={() => setShowNewPw((v) => !v)}>
                   <Ionicons name={showNewPw ? "eye-off" : "eye"} size={18} color={theme.textMuted} />
                 </Pressable>
               </View>
             </View>

             <View style={styles.pwModalField}>
               <Text style={styles.pwModalLabel}>Confirm New Password</Text>
               <TextInput
                 style={[styles.pwModalInput, { paddingHorizontal: 12 }]}
                 value={confirmPw}
                 onChangeText={setConfirmPw}
                 secureTextEntry
                 placeholder="Confirm new password"
                 placeholderTextColor={theme.placeholder}
                 onSubmitEditing={() => void handleChangePassword()}
               />
             </View>

             {pwError && (
               <Text style={styles.pwModalError}>{pwError}</Text>
             )}

             <View style={styles.pwModalActions}>
               <Pressable
                 style={styles.pwModalCancelBtn}
                 onPress={() => setPwModalVisible(false)}
               >
                 <Text style={styles.pwModalCancelText}>Cancel</Text>
               </Pressable>
               <Pressable
                 style={[styles.pwModalSaveBtn, pwSaving && { opacity: 0.6 }]}
                 onPress={() => void handleChangePassword()}
                 disabled={pwSaving}
               >
                 <Text style={styles.pwModalSaveText}>
                   {pwSaving ? "Saving…" : "Change Password"}
                 </Text>
               </Pressable>
             </View>
           </View>
         </View>
       </Modal>
     </ScrollView>
  );
}