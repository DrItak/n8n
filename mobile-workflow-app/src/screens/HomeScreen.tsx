import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWorkflow } from '../context/WorkflowContext';
import { useAIAgent } from '../context/AIAgentContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const { state: workflowState } = useWorkflow();
  const { state: aiState } = useAIAgent();
  const navigation = useNavigation();

  const getActiveWorkflowsCount = () => {
    return workflowState.workflows.filter(w => w.isActive).length;
  };

  const getRecentWorkflows = () => {
    return workflowState.workflows
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  };

  const getActiveTasksCount = () => {
    return aiState.tasks.filter(t => t.status === 'processing').length;
  };

  const QuickActionCard = ({ title, description, icon, onPress, color }: {
    title: string;
    description: string;
    icon: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity style={[styles.quickActionCard, { borderLeftColor: color }]} onPress={onPress}>
      <Icon name={icon} size={24} color={color} style={styles.quickActionIcon} />
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#999" />
    </TouchableOpacity>
  );

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Icon name={icon} size={20} color={color} style={styles.statIcon} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning!</Text>
          <Text style={styles.subtitle}>Ready to automate your workflow?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Icon name="account-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Active Workflows"
              value={getActiveWorkflowsCount()}
              subtitle="Currently running"
              icon="play-circle"
              color="#34C759"
            />
            <StatCard
              title="Total Workflows"
              value={workflowState.workflows.length}
              subtitle="Created workflows"
              icon="workflow"
              color="#007AFF"
            />
            <StatCard
              title="AI Tasks"
              value={getActiveTasksCount()}
              subtitle="In progress"
              icon="robot"
              color="#FF9500"
            />
            <StatCard
              title="Integrations"
              value={workflowState.workflows.filter(w => w.nativeIntegration.status === 'deployed').length}
              subtitle="Native deployed"
              icon="link"
              color="#AF52DE"
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <QuickActionCard
            title="Create New Workflow"
            description="Start building from scratch"
            icon="plus-circle"
            color="#34C759"
            onPress={() => navigation.navigate('WorkflowEditor' as never)}
          />
          <QuickActionCard
            title="Import Workflow"
            description="Import from file or URL"
            icon="download"
            color="#007AFF"
            onPress={() => {/* TODO: Implement import */}}
          />
          <QuickActionCard
            title="AI Analysis"
            description="Analyze existing workflows"
            icon="robot"
            color="#FF9500"
            onPress={() => navigation.navigate('AI Agents' as never)}
          />
          <QuickActionCard
            title="Deploy to System"
            description="Deploy native integrations"
            icon="rocket-launch"
            color="#AF52DE"
            onPress={() => {/* TODO: Implement deployment */}}
          />
        </View>

        {/* Recent Workflows */}
        {getRecentWorkflows().length > 0 && (
          <View style={styles.recentWorkflowsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Workflows</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Workflows' as never)}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {getRecentWorkflows().map((workflow) => (
              <TouchableOpacity
                key={workflow.id}
                style={styles.recentWorkflowCard}
                onPress={() => {
                  // TODO: Navigate to workflow editor with this workflow
                }}
              >
                <View style={styles.workflowInfo}>
                  <Text style={styles.workflowName}>{workflow.name}</Text>
                  <Text style={styles.workflowDescription}>{workflow.description}</Text>
                  <Text style={styles.workflowDate}>
                    Updated {workflow.updatedAt.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.workflowStatus}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: workflow.isActive ? '#34C759' : '#999' }
                  ]} />
                  <Text style={styles.statusText}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Agents Status */}
        <View style={styles.aiAgentsSection}>
          <Text style={styles.sectionTitle}>AI Agents Status</Text>
          <View style={styles.agentsGrid}>
            {aiState.agents.map((agent) => (
              <View key={agent.id} style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <Icon
                    name={agent.type === 'workflow-analyzer' ? 'magnify' :
                          agent.type === 'code-generator' ? 'code-braces' :
                          agent.type === 'integration-specialist' ? 'link' : 'tune'}
                    size={20}
                    color="#007AFF"
                  />
                  <View style={[styles.statusDot, { backgroundColor: agent.isActive ? '#34C759' : '#999' }]} />
                </View>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentDescription} numberOfLines={2}>
                  {agent.description}
                </Text>
                <View style={styles.agentStats}>
                  <Text style={styles.agentStat}>
                    {Math.round(agent.performance.successRate * 100)}% success
                  </Text>
                  <Text style={styles.agentStat}>
                    {agent.performance.averageResponseTime}s avg
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 2,
  },
  profileButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  quickActionsSection: {
    padding: 20,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  recentWorkflowsSection: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  recentWorkflowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workflowInfo: {
    flex: 1,
  },
  workflowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  workflowDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  workflowDate: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  workflowStatus: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  aiAgentsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  agentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  agentCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  agentDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 16,
  },
  agentStats: {
    gap: 2,
  },
  agentStat: {
    fontSize: 10,
    color: '#8E8E93',
  },
});

export default HomeScreen;