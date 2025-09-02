import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAIAgent, AIAgent, AgentTask } from '../context/AIAgentContext';
import { useWorkflow } from '../context/WorkflowContext';

const { width } = Dimensions.get('window');

const AIAgentsScreen: React.FC = () => {
  const { state: aiState, getTasksByWorkflow } = useAIAgent();
  const { state: workflowState } = useWorkflow();
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState<AgentTask | null>(null);

  const getWorkflowName = (workflowId: string) => {
    const workflow = workflowState.workflows.find(w => w.id === workflowId);
    return workflow?.name || 'Unknown Workflow';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'processing':
        return '#FF9500';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'processing':
        return 'loading';
      case 'failed':
        return 'alert-circle';
      default:
        return 'clock';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'analyze':
        return 'magnify';
      case 'generate':
        return 'code-braces';
      case 'optimize':
        return 'tune';
      case 'deploy':
        return 'rocket-launch';
      default:
        return 'cog';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'analyze':
        return '#007AFF';
      case 'generate':
        return '#34C759';
      case 'optimize':
        return '#FF9500';
      case 'deploy':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const handleAgentPress = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setShowAgentDetails(true);
  };

  const handleTaskPress = (task: AgentTask) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const renderAgentCard = ({ item: agent }: { item: AIAgent }) => (
    <TouchableOpacity
      style={styles.agentCard}
      onPress={() => handleAgentPress(agent)}
    >
      <View style={styles.agentHeader}>
        <View style={styles.agentIconContainer}>
          <Icon
            name={
              agent.type === 'workflow-analyzer' ? 'magnify' :
              agent.type === 'code-generator' ? 'code-braces' :
              agent.type === 'integration-specialist' ? 'link' : 'tune'
            }
            size={24}
            color="#007AFF"
          />
        </View>
        <View style={[styles.statusDot, { backgroundColor: agent.isActive ? '#34C759' : '#999' }]} />
      </View>
      
      <Text style={styles.agentName}>{agent.name}</Text>
      <Text style={styles.agentDescription} numberOfLines={2}>
        {agent.description}
      </Text>
      
      <View style={styles.agentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(agent.performance.successRate * 100)}%</Text>
          <Text style={styles.statLabel}>Success</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{agent.performance.averageResponseTime}s</Text>
          <Text style={styles.statLabel}>Avg Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{agent.performance.totalTasks}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>

      <View style={styles.capabilitiesContainer}>
        {agent.capabilities.slice(0, 3).map((capability, index) => (
          <View key={index} style={styles.capabilityTag}>
            <Text style={styles.capabilityText}>{capability}</Text>
          </View>
        ))}
        {agent.capabilities.length > 3 && (
          <Text style={styles.moreCapabilities}>+{agent.capabilities.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderTaskItem = ({ item: task }: { item: AgentTask }) => (
    <TouchableOpacity
      style={styles.taskCard}
      onPress={() => handleTaskPress(task)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTypeContainer}>
          <Icon
            name={getTaskTypeIcon(task.type)}
            size={20}
            color={getTaskTypeColor(task.type)}
          />
          <Text style={styles.taskType}>{task.type.charAt(0).toUpperCase() + task.type.slice(1)}</Text>
        </View>
        <View style={[
          styles.taskStatus,
          { backgroundColor: getStatusColor(task.status) }
        ]}>
          <Icon name={getStatusIcon(task.status)} size={16} color="#FFFFFF" />
          <Text style={styles.taskStatusText}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.workflowName}>{getWorkflowName(task.workflowId)}</Text>
      <Text style={styles.taskDate}>
        {task.createdAt.toLocaleDateString()} at {task.createdAt.toLocaleTimeString()}
      </Text>

      {task.status === 'completed' && task.output && (
        <View style={styles.taskOutput}>
          <Text style={styles.taskOutputLabel}>Output:</Text>
          <Text style={styles.taskOutputText} numberOfLines={2}>
            {JSON.stringify(task.output)}
          </Text>
        </View>
      )}

      {task.status === 'failed' && task.error && (
        <View style={styles.taskError}>
          <Text style={styles.taskErrorLabel}>Error:</Text>
          <Text style={styles.taskErrorText} numberOfLines={2}>
            {task.error}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const AgentDetailsModal = () => (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{selectedAgent?.name}</Text>
          <TouchableOpacity onPress={() => setShowAgentDetails(false)}>
            <Icon name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalDescription}>{selectedAgent?.description}</Text>
          
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Performance Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {Math.round((selectedAgent?.performance.successRate || 0) * 100)}%
                </Text>
                <Text style={styles.metricLabel}>Success Rate</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {selectedAgent?.performance.averageResponseTime}s
                </Text>
                <Text style={styles.metricLabel}>Avg Response Time</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {selectedAgent?.performance.totalTasks}
                </Text>
                <Text style={styles.metricLabel}>Total Tasks</Text>
              </View>
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Capabilities</Text>
            <View style={styles.capabilitiesList}>
              {selectedAgent?.capabilities.map((capability, index) => (
                <View key={index} style={styles.capabilityItem}>
                  <Icon name="check" size={16} color="#34C759" />
                  <Text style={styles.capabilityItemText}>{capability}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Recent Tasks</Text>
            <FlatList
              data={aiState.tasks.filter(t => t.agentId === selectedAgent?.id).slice(0, 5)}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      </View>
    </View>
  );

  const TaskDetailsModal = () => (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Task Details</Text>
          <TouchableOpacity onPress={() => setShowTaskDetails(false)}>
            <Icon name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>Type:</Text>
            <Text style={styles.taskDetailValue}>
              {selectedTask?.type.charAt(0).toUpperCase() + selectedTask?.type.slice(1)}
            </Text>
          </View>

          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>Workflow:</Text>
            <Text style={styles.taskDetailValue}>
              {selectedTask ? getWorkflowName(selectedTask.workflowId) : ''}
            </Text>
          </View>

          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>Status:</Text>
            <View style={[
              styles.taskDetailStatus,
              { backgroundColor: getStatusColor(selectedTask?.status || '') }
            ]}>
              <Text style={styles.taskDetailStatusText}>
                {selectedTask?.status.charAt(0).toUpperCase() + selectedTask?.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.taskDetailSection}>
            <Text style={styles.taskDetailLabel}>Created:</Text>
            <Text style={styles.taskDetailValue}>
              {selectedTask?.createdAt.toLocaleString()}
            </Text>
          </View>

          {selectedTask?.completedAt && (
            <View style={styles.taskDetailSection}>
              <Text style={styles.taskDetailLabel}>Completed:</Text>
              <Text style={styles.taskDetailValue}>
                {selectedTask.completedAt.toLocaleString()}
              </Text>
            </View>
          )}

          {selectedTask?.output && (
            <View style={styles.taskDetailSection}>
              <Text style={styles.taskDetailLabel}>Output:</Text>
              <Text style={styles.taskDetailOutput}>
                {JSON.stringify(selectedTask.output, null, 2)}
              </Text>
            </View>
          )}

          {selectedTask?.error && (
            <View style={styles.taskDetailSection}>
              <Text style={styles.taskDetailLabel}>Error:</Text>
              <Text style={styles.taskDetailError}>{selectedTask.error}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Agents</Text>
        <Text style={styles.headerSubtitle}>
          Intelligent automation powered by AI
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Agents Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Agents</Text>
          <Text style={styles.sectionDescription}>
            Specialized AI agents that analyze, optimize, and deploy your workflows
          </Text>
          
          <FlatList
            data={aiState.agents}
            renderItem={renderAgentCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.agentsList}
            snapToInterval={width - 40}
            decelerationRate="fast"
          />
        </View>

        {/* Active Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Tasks</Text>
          <Text style={styles.sectionDescription}>
            Currently running AI operations
          </Text>
          
          {aiState.tasks.filter(t => t.status === 'processing').length > 0 ? (
            <FlatList
              data={aiState.tasks.filter(t => t.status === 'processing')}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="robot" size={48} color="#C7C7CC" />
              <Text style={styles.emptyStateText}>No active tasks</Text>
              <Text style={styles.emptyStateSubtext}>
                AI agents are ready to help optimize your workflows
              </Text>
            </View>
          )}
        </View>

        {/* Recent Tasks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Tasks</Text>
          <Text style={styles.sectionDescription}>
            Latest AI operations and their results
          </Text>
          
          <FlatList
            data={aiState.tasks.slice(0, 10)}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Agent Details Modal */}
      {showAgentDetails && selectedAgent && <AgentDetailsModal />}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && <TaskDetailsModal />}
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
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 20,
  },
  agentsList: {
    paddingRight: 20,
  },
  agentCard: {
    width: width - 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  agentIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  agentDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  agentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  capabilityTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  capabilityText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  moreCapabilities: {
    fontSize: 12,
    color: '#007AFF',
    alignSelf: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  taskStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  taskStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  workflowName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  taskDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  taskOutput: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  taskOutputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  taskOutputText: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  taskError: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  taskErrorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 4,
  },
  taskErrorText: {
    fontSize: 12,
    color: '#FF3B30',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    width: width - 40,
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  modalContent: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#8E8E93',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginHorizontal: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  capabilitiesList: {
    gap: 12,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  capabilityItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  taskDetailSection: {
    marginBottom: 16,
  },
  taskDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  taskDetailValue: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  taskDetailStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  taskDetailStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  taskDetailOutput: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#1C1C1E',
  },
  taskDetailError: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    color: '#FF3B30',
  },
});

export default AIAgentsScreen;