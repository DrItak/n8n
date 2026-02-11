import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  PanGestureHandler,
  State,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useWorkflow, WorkflowNode } from '../context/WorkflowContext';
import { useAIAgent } from '../context/AIAgentContext';
import DraggableFlatList from 'react-native-draggable-flatlist';

const { width, height } = Dimensions.get('window');

const WorkflowEditorScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { createWorkflow, updateWorkflow, addNode, updateNode, removeNode, state } = useWorkflow();
  const { analyzeWorkflow, generateNativeCode, optimizeWorkflow, deployIntegration } = useAIAgent();
  
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const nodeTypes = [
    { type: 'trigger', name: 'Trigger', icon: 'play-circle', color: '#34C759', description: 'Start of workflow' },
    { type: 'action', name: 'Action', icon: 'cog', color: '#007AFF', description: 'Perform an action' },
    { type: 'condition', name: 'Condition', icon: 'help-circle', color: '#FF9500', description: 'Make a decision' },
    { type: 'integration', name: 'Integration', icon: 'link', color: '#AF52DE', description: 'Connect to service' },
  ];

  const handleSaveWorkflow = () => {
    if (!workflowName.trim()) {
      Alert.alert('Error', 'Please enter a workflow name');
      return;
    }

    if (isEditing) {
      // Update existing workflow
      const currentWorkflow = state.currentWorkflow;
      if (currentWorkflow) {
        const updatedWorkflow = {
          ...currentWorkflow,
          name: workflowName,
          description: workflowDescription,
          updatedAt: new Date(),
        };
        updateWorkflow(updatedWorkflow);
        Alert.alert('Success', 'Workflow updated successfully');
      }
    } else {
      // Create new workflow
      createWorkflow(workflowName, workflowDescription);
      Alert.alert('Success', 'Workflow created successfully');
    }
    
    navigation.goBack();
  };

  const handleAddNode = (nodeType: string) => {
    const newNode: WorkflowNode = {
      id: Date.now().toString(),
      type: nodeType as any,
      name: `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} ${state.currentWorkflow?.nodes.length || 0 + 1}`,
      position: { x: 50, y: 100 + (state.currentWorkflow?.nodes.length || 0) * 120 },
      data: {},
      connections: [],
    };

    if (state.currentWorkflow) {
      addNode(state.currentWorkflow.id, newNode);
    }
    setShowNodePanel(false);
  };

  const handleNodePress = (node: WorkflowNode) => {
    setSelectedNode(node);
    setShowNodePanel(true);
  };

  const handleNodeDelete = (nodeId: string) => {
    if (state.currentWorkflow) {
      removeNode(state.currentWorkflow.id, nodeId);
      setSelectedNode(null);
      setShowNodePanel(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (state.currentWorkflow) {
      await analyzeWorkflow(state.currentWorkflow.id);
      setShowAIPanel(false);
      Alert.alert('AI Analysis', 'Workflow analysis started. Check the AI Agents tab for results.');
    }
  };

  const handleGenerateCode = async () => {
    if (state.currentWorkflow) {
      await generateNativeCode(state.currentWorkflow.id);
      setShowAIPanel(false);
      Alert.alert('Code Generation', 'Native code generation started. Check the AI Agents tab for results.');
    }
  };

  const handleOptimize = async () => {
    if (state.currentWorkflow) {
      await optimizeWorkflow(state.currentWorkflow.id);
      setShowAIPanel(false);
      Alert.alert('Optimization', 'Workflow optimization started. Check the AI Agents tab for results.');
    }
  };

  const handleDeploy = async () => {
    if (state.currentWorkflow) {
      await deployIntegration(state.currentWorkflow.id);
      setShowAIPanel(false);
      Alert.alert('Deployment', 'Integration deployment started. Check the AI Agents tab for results.');
    }
  };

  const renderNode = (node: WorkflowNode) => {
    const nodeType = nodeTypes.find(nt => nt.type === node.type);
    
    return (
      <TouchableOpacity
        key={node.id}
        style={[
          styles.node,
          {
            left: node.position.x,
            top: node.position.y,
            borderColor: nodeType?.color || '#999',
          },
        ]}
        onPress={() => handleNodePress(node)}
      >
        <Icon name={nodeType?.icon || 'circle'} size={20} color={nodeType?.color || '#999'} />
        <Text style={styles.nodeName} numberOfLines={2}>
          {node.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Workflow' : 'New Workflow'}
        </Text>
        <TouchableOpacity onPress={handleSaveWorkflow} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} ref={scrollViewRef}>
        {/* Workflow Details */}
        <View style={styles.detailsSection}>
          <TextInput
            style={styles.nameInput}
            placeholder="Workflow Name"
            value={workflowName}
            onChangeText={setWorkflowName}
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.descriptionInput}
            placeholder="Description (optional)"
            value={workflowDescription}
            onChangeText={setWorkflowDescription}
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Workflow Canvas */}
        <View style={styles.canvasSection}>
          <View style={styles.canvasHeader}>
            <Text style={styles.sectionTitle}>Workflow Canvas</Text>
            <View style={styles.canvasActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowNodePanel(true)}
              >
                <Icon name="plus" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Add Node</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowAIPanel(true)}
              >
                <Icon name="robot" size={20} color="#FF9500" />
                <Text style={styles.actionButtonText}>AI Tools</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.canvas}>
            {state.currentWorkflow?.nodes.map(renderNode)}
            {state.currentWorkflow?.nodes.length === 0 && (
              <View style={styles.emptyCanvas}>
                <Icon name="workflow" size={48} color="#C7C7CC" />
                <Text style={styles.emptyCanvasText}>No nodes yet</Text>
                <Text style={styles.emptyCanvasSubtext}>
                  Tap "Add Node" to start building your workflow
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Native Integration Status */}
        {state.currentWorkflow && (
          <View style={styles.integrationSection}>
            <Text style={styles.sectionTitle}>Native Integration</Text>
            <View style={styles.integrationCard}>
              <View style={styles.integrationHeader}>
                <Icon
                  name={
                    state.currentWorkflow.nativeIntegration.type === 'shortcuts' ? 'cellphone-link' :
                    state.currentWorkflow.nativeIntegration.type === 'applescript' ? 'code-braces' :
                    state.currentWorkflow.nativeIntegration.type === 'automator' ? 'cog' : 'link-off'
                  }
                  size={24}
                  color="#007AFF"
                />
                <Text style={styles.integrationType}>
                  {state.currentWorkflow.nativeIntegration.type === 'none' 
                    ? 'Not Integrated' 
                    : state.currentWorkflow.nativeIntegration.type.charAt(0).toUpperCase() + 
                      state.currentWorkflow.nativeIntegration.type.slice(1)
                  }
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    state.currentWorkflow.nativeIntegration.status === 'deployed' ? '#34C759' :
                    state.currentWorkflow.nativeIntegration.status === 'generated' ? '#FF9500' :
                    state.currentWorkflow.nativeIntegration.status === 'error' ? '#FF3B30' : '#8E8E93'
                }
              ]}>
                <Text style={styles.statusText}>
                  {state.currentWorkflow.nativeIntegration.status.charAt(0).toUpperCase() + 
                   state.currentWorkflow.nativeIntegration.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Node Panel */}
      {showNodePanel && (
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Add Node</Text>
              <TouchableOpacity onPress={() => setShowNodePanel(false)}>
                <Icon name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.nodeTypesGrid}>
              {nodeTypes.map((nodeType) => (
                <TouchableOpacity
                  key={nodeType.type}
                  style={styles.nodeTypeCard}
                  onPress={() => handleAddNode(nodeType.type)}
                >
                  <Icon name={nodeType.icon} size={32} color={nodeType.color} />
                  <Text style={styles.nodeTypeName}>{nodeType.name}</Text>
                  <Text style={styles.nodeTypeDescription}>{nodeType.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* AI Tools Panel */}
      {showAIPanel && (
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>AI Tools</Text>
              <TouchableOpacity onPress={() => setShowAIPanel(false)}>
                <Icon name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.aiToolsGrid}>
              <TouchableOpacity style={styles.aiToolCard} onPress={handleAIAnalysis}>
                <Icon name="magnify" size={24} color="#007AFF" />
                <Text style={styles.aiToolName}>Analyze Workflow</Text>
                <Text style={styles.aiToolDescription}>Get insights and optimization suggestions</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiToolCard} onPress={handleGenerateCode}>
                <Icon name="code-braces" size={24} color="#34C759" />
                <Text style={styles.aiToolName}>Generate Native Code</Text>
                <Text style={styles.aiToolDescription}>Create iOS/macOS integrations</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiToolCard} onPress={handleOptimize}>
                <Icon name="tune" size={24} color="#FF9500" />
                <Text style={styles.aiToolName}>Optimize Performance</Text>
                <Text style={styles.aiToolDescription}>Improve efficiency and resource usage</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.aiToolCard} onPress={handleDeploy}>
                <Icon name="rocket-launch" size={24} color="#AF52DE" />
                <Text style={styles.aiToolName}>Deploy Integration</Text>
                <Text style={styles.aiToolDescription}>Install and activate native integration</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Node Details Panel */}
      {showNodePanel && selectedNode && (
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Node Details</Text>
              <TouchableOpacity onPress={() => setShowNodePanel(false)}>
                <Icon name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <View style={styles.nodeDetails}>
              <Text style={styles.nodeDetailLabel}>Name:</Text>
              <TextInput
                style={styles.nodeDetailInput}
                value={selectedNode.name}
                onChangeText={(text) => {
                  const updatedNode = { ...selectedNode, name: text };
                  if (state.currentWorkflow) {
                    updateNode(state.currentWorkflow.id, updatedNode);
                  }
                  setSelectedNode(updatedNode);
                }}
              />
              <Text style={styles.nodeDetailLabel}>Type:</Text>
              <Text style={styles.nodeDetailValue}>{selectedNode.type}</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleNodeDelete(selectedNode.id)}
              >
                <Icon name="delete" size={20} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete Node</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  detailsSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 16,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#8E8E93',
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  canvasSection: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  canvasActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  canvas: {
    height: 400,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  emptyCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCanvasText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyCanvasSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  node: {
    position: 'absolute',
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#1C1C1E',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  integrationSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  integrationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  integrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  integrationType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  panel: {
    width: width - 40,
    maxHeight: height * 0.8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  nodeTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  nodeTypeCard: {
    width: (width - 80) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  nodeTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  nodeTypeDescription: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  aiToolsGrid: {
    gap: 16,
  },
  aiToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    gap: 12,
  },
  aiToolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  aiToolDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  nodeDetails: {
    gap: 16,
  },
  nodeDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  nodeDetailInput: {
    fontSize: 16,
    color: '#1C1C1E',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  nodeDetailValue: {
    fontSize: 16,
    color: '#8E8E93',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

export default WorkflowEditorScreen;