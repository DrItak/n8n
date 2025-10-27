import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'integration';
  name: string;
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  nativeIntegration: {
    type: 'shortcuts' | 'applescript' | 'automator' | 'none';
    code: string;
    status: 'pending' | 'generated' | 'deployed' | 'error';
  };
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
}

type WorkflowAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKFLOWS'; payload: Workflow[] }
  | { type: 'ADD_WORKFLOW'; payload: Workflow }
  | { type: 'UPDATE_WORKFLOW'; payload: Workflow }
  | { type: 'DELETE_WORKFLOW'; payload: string }
  | { type: 'SET_CURRENT_WORKFLOW'; payload: Workflow | null }
  | { type: 'UPDATE_NODE'; payload: { workflowId: string; node: WorkflowNode } }
  | { type: 'ADD_NODE'; payload: { workflowId: string; node: WorkflowNode } }
  | { type: 'REMOVE_NODE'; payload: { workflowId: string; nodeId: string } };

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
};

const workflowReducer = (state: WorkflowState, action: WorkflowAction): WorkflowState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_WORKFLOWS':
      return { ...state, workflows: action.payload };
    case 'ADD_WORKFLOW':
      return { ...state, workflows: [...state.workflows, action.payload] };
    case 'UPDATE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.map(w => w.id === action.payload.id ? action.payload : w),
        currentWorkflow: state.currentWorkflow?.id === action.payload.id ? action.payload : state.currentWorkflow,
      };
    case 'DELETE_WORKFLOW':
      return {
        ...state,
        workflows: state.workflows.filter(w => w.id !== action.payload),
        currentWorkflow: state.currentWorkflow?.id === action.payload ? null : state.currentWorkflow,
      };
    case 'SET_CURRENT_WORKFLOW':
      return { ...state, currentWorkflow: action.payload };
    case 'UPDATE_NODE':
      return {
        ...state,
        workflows: state.workflows.map(w => {
          if (w.id === action.payload.workflowId) {
            return {
              ...w,
              nodes: w.nodes.map(n => n.id === action.payload.node.id ? action.payload.node : n),
              updatedAt: new Date(),
            };
          }
          return w;
        }),
        currentWorkflow: state.currentWorkflow?.id === action.payload.workflowId
          ? {
              ...state.currentWorkflow,
              nodes: state.currentWorkflow.nodes.map(n => n.id === action.payload.node.id ? action.payload.node : n),
              updatedAt: new Date(),
            }
          : state.currentWorkflow,
      };
    case 'ADD_NODE':
      return {
        ...state,
        workflows: state.workflows.map(w => {
          if (w.id === action.payload.workflowId) {
            return {
              ...w,
              nodes: [...w.nodes, action.payload.node],
              updatedAt: new Date(),
            };
          }
          return w;
        }),
        currentWorkflow: state.currentWorkflow?.id === action.payload.workflowId
          ? {
              ...state.currentWorkflow,
              nodes: [...state.currentWorkflow.nodes, action.payload.node],
              updatedAt: new Date(),
            }
          : state.currentWorkflow,
      };
    case 'REMOVE_NODE':
      return {
        ...state,
        workflows: state.workflows.map(w => {
          if (w.id === action.payload.workflowId) {
            return {
              ...w,
              nodes: w.nodes.filter(n => n.id !== action.payload.nodeId),
              updatedAt: new Date(),
            };
          }
          return w;
        }),
        currentWorkflow: state.currentWorkflow?.id === action.payload.workflowId
          ? {
              ...state.currentWorkflow,
              nodes: state.currentWorkflow.nodes.filter(n => n.id !== action.payload.nodeId),
              updatedAt: new Date(),
            }
          : state.currentWorkflow,
      };
    default:
      return state;
  }
};

interface WorkflowContextType {
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowAction>;
  createWorkflow: (name: string, description: string) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (id: string) => void;
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addNode: (workflowId: string, node: WorkflowNode) => void;
  updateNode: (workflowId: string, node: WorkflowNode) => void;
  removeNode: (workflowId: string, nodeId: string) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  const createWorkflow = (name: string, description: string) => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name,
      description,
      nodes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: false,
      nativeIntegration: {
        type: 'none',
        code: '',
        status: 'pending',
      },
    };
    dispatch({ type: 'ADD_WORKFLOW', payload: newWorkflow });
  };

  const updateWorkflow = (workflow: Workflow) => {
    dispatch({ type: 'UPDATE_WORKFLOW', payload: workflow });
  };

  const deleteWorkflow = (id: string) => {
    dispatch({ type: 'DELETE_WORKFLOW', payload: id });
  };

  const setCurrentWorkflow = (workflow: Workflow | null) => {
    dispatch({ type: 'SET_CURRENT_WORKFLOW', payload: workflow });
  };

  const addNode = (workflowId: string, node: WorkflowNode) => {
    dispatch({ type: 'ADD_NODE', payload: { workflowId, node } });
  };

  const updateNode = (workflowId: string, node: WorkflowNode) => {
    dispatch({ type: 'UPDATE_NODE', payload: { workflowId, node } });
  };

  const removeNode = (workflowId: string, nodeId: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: { workflowId, nodeId } });
  };

  return (
    <WorkflowContext.Provider
      value={{
        state,
        dispatch,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        setCurrentWorkflow,
        addNode,
        updateNode,
        removeNode,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};