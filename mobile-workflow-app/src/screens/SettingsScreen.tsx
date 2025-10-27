import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [cloudBackupEnabled, setCloudBackupEnabled] = useState(true);

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all workflows and settings to a file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => {
          // TODO: Implement data export
          Alert.alert('Success', 'Data exported successfully');
        }},
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Import workflows and settings from a file? This will overwrite existing data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', style: 'destructive', onPress: () => {
          // TODO: Implement data import
          Alert.alert('Success', 'Data imported successfully');
        }},
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all workflows and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: () => {
          // TODO: Implement data clearing
          Alert.alert('Success', 'All data cleared successfully');
        }},
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Reset all settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          // TODO: Implement settings reset
          Alert.alert('Success', 'Settings reset to defaults');
        }},
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showSwitch = false, 
    switchValue = false, 
    onSwitchChange = () => {},
    showArrow = true,
    danger = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchChange?: (value: boolean) => void;
    showArrow?: boolean;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, danger && styles.settingItemDanger]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingItemLeft}>
        <Icon 
          name={icon} 
          size={24} 
          color={danger ? '#FF3B30' : '#007AFF'} 
          style={styles.settingIcon}
        />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, danger && styles.settingTitleDanger]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
            thumbColor="#FFFFFF"
          />
        ) : showArrow ? (
          <Icon name="chevron-right" size={20} color="#8E8E93" />
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.settingSection}>
      <Text style={styles.settingSectionTitle}>{title}</Text>
      <View style={styles.settingSectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Customize your workflow automation experience
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Preferences */}
        <SettingSection title="Preferences">
          <SettingItem
            icon="bell"
            title="Push Notifications"
            subtitle="Get notified about workflow status and AI agent updates"
            showSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchChange={setNotificationsEnabled}
          />
          <SettingItem
            icon="sync"
            title="Auto Sync"
            subtitle="Automatically sync workflows across devices"
            showSwitch={true}
            switchValue={autoSyncEnabled}
            onSwitchChange={setAutoSyncEnabled}
          />
          <SettingItem
            icon="theme-light-dark"
            title="Dark Mode"
            subtitle="Use dark theme for better visibility in low light"
            showSwitch={true}
            switchValue={darkModeEnabled}
            onSwitchChange={setDarkModeEnabled}
          />
          <SettingItem
            icon="fingerprint"
            title="Biometric Authentication"
            subtitle="Use Face ID or Touch ID to secure the app"
            showSwitch={true}
            switchValue={biometricEnabled}
            onSwitchChange={setBiometricEnabled}
          />
          <SettingItem
            icon="cloud-upload"
            title="iCloud Backup"
            subtitle="Automatically backup workflows to iCloud"
            showSwitch={true}
            switchValue={cloudBackupEnabled}
            onSwitchChange={setCloudBackupEnabled}
          />
        </SettingSection>

        {/* AI Agents */}
        <SettingSection title="AI Agents">
          <SettingItem
            icon="robot"
            title="AI Agent Configuration"
            subtitle="Configure AI agent behavior and preferences"
            onPress={() => {
              // TODO: Navigate to AI agent configuration
              Alert.alert('AI Configuration', 'AI agent configuration screen coming soon');
            }}
          />
          <SettingItem
            icon="tune"
            title="Performance Settings"
            subtitle="Adjust AI agent performance and resource usage"
            onPress={() => {
              // TODO: Navigate to performance settings
              Alert.alert('Performance', 'Performance settings screen coming soon');
            }}
          />
          <SettingItem
            icon="shield"
            title="Privacy & Security"
            subtitle="Manage data privacy and security settings"
            onPress={() => {
              // TODO: Navigate to privacy settings
              Alert.alert('Privacy', 'Privacy settings screen coming soon');
            }}
          />
        </SettingSection>

        {/* Integration */}
        <SettingSection title="Integration">
          <SettingItem
            icon="cellphone-link"
            title="Shortcuts Integration"
            subtitle="Configure iOS Shortcuts integration settings"
            onPress={() => {
              // TODO: Navigate to shortcuts settings
              Alert.alert('Shortcuts', 'Shortcuts integration settings coming soon');
            }}
          />
          <SettingItem
            icon="code-braces"
            title="AppleScript Settings"
            subtitle="Configure AppleScript execution preferences"
            onPress={() => {
              // TODO: Navigate to AppleScript settings
              Alert.alert('AppleScript', 'AppleScript settings coming soon');
            }}
          />
          <SettingItem
            icon="cog"
            title="Automator Integration"
            subtitle="Configure macOS Automator integration"
            onPress={() => {
              // TODO: Navigate to Automator settings
              Alert.alert('Automator', 'Automator integration settings coming soon');
            }}
          />
          <SettingItem
            icon="link"
            title="System Permissions"
            subtitle="Manage app permissions and accessibility settings"
            onPress={() => {
              // TODO: Navigate to permissions
              Alert.alert('Permissions', 'System permissions screen coming soon');
            }}
          />
        </SettingSection>

        {/* Data Management */}
        <SettingSection title="Data Management">
          <SettingItem
            icon="download"
            title="Export Data"
            subtitle="Export all workflows and settings to a file"
            onPress={handleExportData}
          />
          <SettingItem
            icon="upload"
            title="Import Data"
            subtitle="Import workflows and settings from a file"
            onPress={handleImportData}
          />
          <SettingItem
            icon="database"
            title="Storage Usage"
            subtitle="View and manage app storage usage"
            onPress={() => {
              // TODO: Show storage usage
              Alert.alert('Storage', 'Storage usage: 45.2 MB');
            }}
          />
        </SettingSection>

        {/* Support */}
        <SettingSection title="Support">
          <SettingItem
            icon="help-circle"
            title="Help & Documentation"
            subtitle="Access help guides and tutorials"
            onPress={() => {
              // TODO: Navigate to help
              Alert.alert('Help', 'Help documentation coming soon');
            }}
          />
          <SettingItem
            icon="message"
            title="Contact Support"
            subtitle="Get help from our support team"
            onPress={() => {
              // TODO: Navigate to support
              Alert.alert('Support', 'Contact support screen coming soon');
            }}
          />
          <SettingItem
            icon="bug"
            title="Report Bug"
            subtitle="Report issues or suggest improvements"
            onPress={() => {
              // TODO: Navigate to bug report
              Alert.alert('Bug Report', 'Bug reporting screen coming soon');
            }}
          />
          <SettingItem
            icon="star"
            title="Rate App"
            subtitle="Rate us on the App Store"
            onPress={() => {
              // TODO: Open App Store rating
              Alert.alert('Rating', 'Opening App Store...');
            }}
          />
        </SettingSection>

        {/* About */}
        <SettingSection title="About">
          <SettingItem
            icon="information"
            title="App Version"
            subtitle="1.0.0 (Build 1)"
            showArrow={false}
          />
          <SettingItem
            icon="calendar"
            title="Last Updated"
            subtitle="December 2024"
            showArrow={false}
          />
          <SettingItem
            icon="code-tags"
            title="Open Source"
            subtitle="View source code and contribute"
            onPress={() => {
              // TODO: Open GitHub repository
              Alert.alert('Open Source', 'Opening GitHub repository...');
            }}
          />
        </SettingSection>

        {/* Danger Zone */}
        <SettingSection title="Danger Zone">
          <SettingItem
            icon="refresh"
            title="Reset All Settings"
            subtitle="Reset all settings to default values"
            onPress={handleResetSettings}
            danger={true}
          />
          <SettingItem
            icon="delete"
            title="Clear All Data"
            subtitle="Permanently delete all workflows and data"
            onPress={handleClearData}
            danger={true}
          />
        </SettingSection>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  scrollView: {
    flex: 1,
  },
  settingSection: {
    marginBottom: 24,
  },
  settingSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingSectionContent: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingItemDanger: {
    borderBottomColor: '#FFE5E5',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  settingTitleDanger: {
    color: '#FF3B30',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  settingItemRight: {
    alignItems: 'center',
  },
});

export default SettingsScreen;