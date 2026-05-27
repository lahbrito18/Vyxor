import styled from 'styled-components';
import {
  Dispatch,
  JSX,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePCBuildSceneBuilder } from '@/PCBuildSceneBuilder';
import { PCCModel } from '@/runtime/PCCModel';
import { ToggleTarget } from '@/runtime/ToggleTarget';
import { PCCRuntime } from '@/runtime/PCCRuntime';
import { MountPoint } from '@/runtime/MountPoint';
import { MPNameMap } from '@/Constants';
import { verticalUiSize, horizontalUiSize } from '..';
import { ComponentListPanel } from './ComponentListPanel';
import { LoadingScreen } from './LoadingScreen';

const PCCProblemMissionRootDiv = styled.div`
  background-color: #020617;
  @media screen and (orientation: portrait) {
    width: 100%;
    height: ${() => verticalUiSize};
  }
  @media screen and (orientation: landscape) {
    width: ${() => horizontalUiSize};
    height: 100%;
  }
  position: relative;
  overflow: hidden;
`;

const PcComponentsListDiv = styled.div`
  background-color: #0f172a;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-bottom: 5px;
`;

const TreeItemDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 45px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
  user-select: none;
  transition: 0.2s;

  &:hover {
    background-color: #334155;
  }
`;

const TreeItemInnerDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #1e293b;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
`;

const TreeItemDropdownToggleDiv = styled.div`
  width: 40px;
  text-align: center;
  align-items: center;
  background-color: #1e293b;
  color: white;
  font-weight: bold;
  font-size: 20px;
  position: relative;
`;

const TreeItemTitleInnerDiv = styled.div`
  flex: 1;
  align-content: center;
  text-align: right;
`;

const TreeItemDisposeButtonDiv = styled.div`
  width: 40px;
  text-align: center;
  align-items: center;
  color: white;
  font-weight: bold;
  font-size: 20px;
  transform: translateY(-2px);
`;

const TreeItemToggleOuterDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 5px;
  box-sizing: border-box;
`;

const TreeItemTogglesContainerDiv = styled.div`
  border-style: solid;
  border-width: 2px;
  border-color: #1e293b;
  border-top-width: 0;
`;

interface TreeItemToggleDivProps {
  $enabled: boolean;
}

const TreeItemToggleDiv = styled.div<TreeItemToggleDivProps>`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: #334155;
  color: white;
  opacity: ${props => (props.$enabled ? 1 : 0.5)};
  transition: opacity 0.2s;
`;

const ToggleNameMp: Record<string, string> = {
  drive_holder: 'Painel Lateral do Case (Traseiro)',
  front_panel: 'Painel Frontal do Case',
  side_armour: 'Parafusos do Case',
  side_glass: 'Painel Lateral do Case (Frontal)',
  power_nail: 'Parafusos da Power Supply',
};

const TreeViewRerenderContext = createContext<() => void>(() => {});

interface TreeItemToggleProps {
  toggleTarget: ToggleTarget;
}

function TreeItemToggle(props: TreeItemToggleProps): JSX.Element {
  const { toggleTarget } = props;
  const rerender = useContext(TreeViewRerenderContext);

  const onToggle = useCallback(() => {
    toggleTarget.setEnabled(!toggleTarget.enabled);
    rerender();
  }, [toggleTarget, rerender]);

  return (
    <TreeItemToggleOuterDiv onClick={onToggle}>
      <TreeItemToggleDiv $enabled={toggleTarget.enabled}>
        {ToggleNameMp[toggleTarget.name] || toggleTarget.name}
      </TreeItemToggleDiv>
    </TreeItemToggleOuterDiv>
  );
}

const TreeItemContentOuterDiv = styled.div`
  padding-top: 5px;
  padding-bottom: 5px;
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: row;
`;

const VerticalLineDiv = styled.div`
  width: 5px;
  height: 100%;
  margin-left: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
  box-sizing: border-box;
  background-color: #334155;
  border-radius: 40px;
`;

const TreeItemContentDiv = styled.div`
  width: 100%;
  height: auto;
  display: flex;
  flex-direction: column;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
`;

const EmptyMountPointDiv = styled.div`
  padding: 5px;
  padding-bottom: 0;
  box-sizing: border-box;
  width: 100%;
  flex: 0 0 45px;
  flex-direction: column;
  text-align: center;
  vertical-align: middle;
`;

const EmptyMountPointInnerDiv = styled.div`
  width: 100%;
  height: 40px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: #2563eb;
  color: white;
  cursor: pointer;
  transition: 0.2s;

  &:hover {
    background-color: #1d4ed8;
  }
`;

const MountPointNameDiv = styled.div`
  font-weight: normal;
  font-size: 16px;
  padding-left: 10px;
`;

const MountPointAttachHintDiv = styled.div`
  font-size: 12px;
  font-weight: normal;
  color: #d8d8d8;
  padding-right: 10px;
  cursor: pointer;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(2, 6, 23, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

interface ModalContentProps {
  $isSuccess: boolean;
}

const ModalContent = styled.div<ModalContentProps>`
  background: #0f172a;
  border: 1px solid
    ${props =>
      props.$isSuccess ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)'};
  padding: 32px;
  border-radius: 24px;
  width: min(480px, calc(100vw - 32px));
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  color: white;
  animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes scaleUp {
    from {
      transform: scale(0.9);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const ModalTitle = styled.h2<ModalContentProps>`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
  color: ${props => (props.$isSuccess ? '#4ade80' : '#f87171')};
`;

const ModalText = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 24px;
  white-space: pre-line;
`;

const ModalButton = styled.button`
  width: 100%;
  height: 46px;
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #1d4ed8;
  }
`;

interface EmptyMountPointProps {
  mountPoint: MountPoint | 'root';
  onClick: (mountPoint: MountPoint | 'root') => void;
}

function EmptyMountPoint(props: EmptyMountPointProps): JSX.Element {
  const { mountPoint, onClick } = props;

  const innerName =
    typeof mountPoint === 'string' ? mountPoint : mountPoint.name;

  const name = MPNameMap[innerName] || innerName;

  return (
    <EmptyMountPointDiv>
      <EmptyMountPointInnerDiv onClick={() => onClick(mountPoint)}>
        <MountPointNameDiv>{name}</MountPointNameDiv>
        <MountPointAttachHintDiv>
          Clique para carregar novo componente
        </MountPointAttachHintDiv>
      </EmptyMountPointInnerDiv>
    </EmptyMountPointDiv>
  );
}

const PCCRuntimeContext = createContext<PCCRuntime | undefined>(undefined);

interface TreePCCViewProps {
  model: PCCModel;
  onClickEmptyMountPoint: (mountPoint: MountPoint | 'root') => void;
}

function TreePCCView(props: TreePCCViewProps): JSX.Element {
  const { model, onClickEmptyMountPoint } = props;

  const rerender = useContext(TreeViewRerenderContext);

  const [isShowingToggleTargets, setIsShowingToggleTargets] = useState(false);

  const onDispose = useCallback(() => {
    if (model.parentMountPoint) {
      model.parentMountPoint.attachedModel = undefined;
    }

    model.dispose();

    setTimeout(() => {
      rerender();
    }, 100);
  }, [model, rerender]);

  const ComponentNameMap: Record<string, string> = {
    case_sample: 'Gabinete',
    atx_motherboard_sample: 'Placa-mãe',
    cooler_sample: 'Cooler',
    gpu_sample: 'Placa de vídeo',
    atx_power_sample: 'Fonte',
    ddr4_ram_sample: 'Memória RAM',
    cpu_sample: 'Processador',
    nvme_ssd_sample: 'SSD NVMe',
    '120mm_fan_sample': 'Ventoinha 120 mm',
  };

  return (
    <>
      <TreeItemDiv>
        <TreeItemInnerDiv>
          {model.toggleTargets.length > 0 ? (
            <TreeItemDropdownToggleDiv
              onClick={() => setIsShowingToggleTargets(!isShowingToggleTargets)}
            >
              {isShowingToggleTargets ? '▼' : '▶'}
            </TreeItemDropdownToggleDiv>
          ) : (
            <TreeItemDropdownToggleDiv />
          )}

          <TreeItemTitleInnerDiv>
            {ComponentNameMap[model.name] || model.name}
          </TreeItemTitleInnerDiv>

          <TreeItemDisposeButtonDiv onClick={onDispose}>
            ✖
          </TreeItemDisposeButtonDiv>
        </TreeItemInnerDiv>

        {isShowingToggleTargets ? (
          <TreeItemTogglesContainerDiv>
            {model.toggleTargets.map(toggleTarget => (
              <TreeItemToggle
                key={toggleTarget.name}
                toggleTarget={toggleTarget}
              />
            ))}
          </TreeItemTogglesContainerDiv>
        ) : null}
      </TreeItemDiv>

      {model.mountPoints.length > 0 ? (
        <TreeItemContentOuterDiv>
          <VerticalLineDiv />
          <TreeItemContentDiv>
            {model.mountPoints.map(mountPoint =>
              mountPoint.attachedModel ? (
                <TreePCCView
                  key={mountPoint.name}
                  model={mountPoint.attachedModel}
                  onClickEmptyMountPoint={onClickEmptyMountPoint}
                />
              ) : (
                <EmptyMountPoint
                  key={mountPoint.name}
                  mountPoint={mountPoint}
                  onClick={onClickEmptyMountPoint}
                />
              ),
            )}
          </TreeItemContentDiv>
        </TreeItemContentOuterDiv>
      ) : null}
    </>
  );
}

const GlobalMissionOverlay = styled.div`
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  width: min(420px, calc(100vw - 32px));
  padding: 16px;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.28);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
  color: white;
`;

export default function PCCProblemMissionRoot(props: {
  percent: number;
  setPrecent: Dispatch<SetStateAction<number>>;
}): JSX.Element {
  const { percent, setPrecent } = props;
  const builder = usePCBuildSceneBuilder();

  const [isInitialized, setIsInitialized] = useState(false);
  const [rerenderState, setRerenderState] = useState(false);
  const [baseModel, setBaseModel] = useState<PCCModel | undefined>(undefined);
  const [selectedTarget, setSelectedTarget] = useState<
    MountPoint | 'root' | undefined
  >();

  // 🌟 ADICIONADO: Estados para controle do Modal customizado
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  const onBaseModelChanged = useCallback((model: PCCModel | undefined) => {
    setBaseModel(model);
  }, []);

  const normalizeModelName = (name?: string) =>
    (name || '').trim().toLowerCase();

  const isModelAlive = (model?: PCCModel) => {
    if (!model) return false;
    const anyModel = model as any;
    return !anyModel.disposed && !anyModel.isDisposed && !anyModel._disposed;
  };

  const refreshMissionState = useCallback(() => {
    setRerenderState(prev => !prev);
  }, []);

  const missionState = useMemo(() => {
    const installedNames: string[] = [];

    function collectNames(model?: PCCModel) {
      if (!model || !isModelAlive(model)) return;

      installedNames.push(normalizeModelName(model.name));

      model.mountPoints.forEach(mp => {
        if (mp?.attachedModel && isModelAlive(mp.attachedModel)) {
          collectNames(mp.attachedModel);
        }
      });
    }

    collectNames(baseModel);

    const matches = (pattern: string, name: string) =>
      normalizeModelName(name).includes(pattern);

    const countOf = (pattern: string) =>
      installedNames.filter(name => matches(pattern, name)).length;

    const ssdCount = countOf('ssd');
    const ramCount = countOf('ram');

    const visibleItems = [
      {
        id: 'ram_expand',
        label:
          'Mitigar o gargalo severo de paginação e insuficiência de memória volátil.',
        done: ramCount >= 2,
      },
      {
        id: 'ssd_isolate',
        label:
          'Sanar as falhas críticas e flutuações de energia relatadas na trilha A1.',
        done: ssdCount === 1,
      },
    ];

    const solved = visibleItems.filter(item => item.done).length;
    const progress =
      visibleItems.length > 0 ? (solved / visibleItems.length) * 100 : 0;

    return {
      visibleItems,
      solved,
      progress,
    };
  }, [baseModel, rerenderState]);

  const handleFinishMission = useCallback(() => {
    const pendingVisible = missionState.visibleItems.filter(item => !item.done);

    if (pendingVisible.length === 0) {
      setModalSuccess(true);
      setModalMessage(
        'Parabéns! O diagnóstico foi preciso, os barramentos foram rearranjados e a memória expandida. O sistema voltou a operar em perfeitas condições!',
      );
      setModalOpen(true);
      return;
    }

    const visibleMessage = `Sintomas do sistema ainda persistentes:\n${pendingVisible
      .map(item => `- ${item.label}`)
      .join('\n')}`;

    setModalSuccess(false);
    setModalMessage(`Análise incompleta.\n\n${visibleMessage}`);
    setModalOpen(true);
  }, [missionState]);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  const onComponentSelected = useCallback(
    (modelUrl: string | undefined) => {
      if (builder === undefined || selectedTarget === undefined) {
        return;
      }

      const currentTarget = selectedTarget;
      setSelectedTarget(undefined);

      if (modelUrl === undefined) {
        refreshMissionState();
        return;
      }

      const runtime = builder.runtime;

      (async () => {
        try {
          const model = await runtime.addModel(modelUrl);
          if (!model) {
            refreshMissionState();
            return;
          }

          if (currentTarget === 'root') {
            runtime.setBaseModel(model);
            runtime.disposeUnboundedModels();
            refreshMissionState();
            return;
          }

          const attached = currentTarget.attach(model);

          if (!attached) {
            window.alert(
              `Não foi possível acoplar o componente ${model.name} neste encaixe.`,
            );
            model.dispose(true);
            refreshMissionState();
            return;
          }

          setTimeout(() => {
            refreshMissionState();
          }, 50);
        } catch (error) {
          console.error('Erro ao carregar componente:', error);
          refreshMissionState();
        }
      })();
    },
    [builder, selectedTarget, refreshMissionState],
  );

  useEffect(() => {
    if (builder === undefined) return;
    if (isInitialized) return;

    setIsInitialized(true);

    const runtime = builder.runtime;
    runtime.playAnimation();
    runtime.onBaseModelChangedObservable.add(onBaseModelChanged);

    function increaseTo(end: number) {
      return new Promise<void>(resolve => {
        const id = setInterval(() => {
          setPrecent(prev => {
            if (prev >= end) {
              clearInterval(id);
              resolve();
              return prev;
            }
            return prev + 1;
          });
        }, 60);
      });
    }

    (async () => {
      const [caseModel] = await Promise.all([
        runtime.addModel('res/case_sample.glb'),
        increaseTo(30),
      ]);
      runtime.setBaseModel(caseModel!);

      const [motherboardModel] = await Promise.all([
        runtime.addModel('res/atx_motherboard_sample.glb'),
        increaseTo(50),
      ]);
      const [coolerModel] = await Promise.all([
        runtime.addModel('res/cooler_sample.glb'),
        increaseTo(65),
      ]);
      const [powerSupplyModel] = await Promise.all([
        runtime.addModel('res/atx_power_sample.glb'),
        increaseTo(75),
      ]);
      const [ramModel] = await Promise.all([
        runtime.addModel('res/ddr4_ram_sample.glb'),
        increaseTo(85),
      ]);
      const [cpuModel] = await Promise.all([
        runtime.addModel('res/cpu_sample.glb'),
        increaseTo(90),
      ]);
      const [fanModel] = await Promise.all([
        runtime.addModel('res/120mm_fan_sample.glb'),
        increaseTo(95),
      ]);

      const [gpuModel] = await Promise.all([
        runtime.addModel('res/gpu_sample.glb'),
        increaseTo(98),
      ]);

      const [ssdModel1, ssdModel2] = await Promise.all([
        runtime.addModel('res/nvme_ssd_sample.glb'),
        runtime.addModel('res/nvme_ssd_sample.glb'),
      ]);

      const fanModels: PCCModel[] = [fanModel!];
      for (let i = 0; i < 4; ++i) {
        const extraFan = await runtime.addModel('res/120mm_fan_sample.glb');
        if (extraFan) fanModels.push(extraFan);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      let fanIndex = 0;
      const caseMPs = caseModel!.mountPoints;
      for (let mp of caseMPs) {
        if (
          !mp.attachedModel &&
          fanModels[fanIndex] &&
          mp.attach(fanModels[fanIndex])
        ) {
          fanIndex++;
        }
      }

      for (let mp of caseMPs) {
        if (!mp.attachedModel && mp.attach(powerSupplyModel!)) break;
      }

      for (let mp of caseMPs) {
        if (!mp.attachedModel && mp.attach(motherboardModel!)) break;
      }

      const moboMPs = motherboardModel!.mountPoints;
      for (let mp of moboMPs) {
        if (!mp.attachedModel && mp.attach(cpuModel!)) break;
      }

      for (let mp of moboMPs) {
        if (!mp.attachedModel && mp.attach(coolerModel!)) break;
      }
      for (let mp of moboMPs) {
        if (!mp.attachedModel && mp.attach(ramModel!)) break;
      }

      let gpuAttached = false;
      for (let mp of moboMPs) {
        if (mp.attach(gpuModel!)) {
          gpuAttached = true;
          break;
        }
      }
      if (!gpuAttached) {
        for (let mp of caseMPs) {
          if (mp.attach(gpuModel!)) {
            gpuAttached = true;
            break;
          }
        }
      }

      const storageModels = [ssdModel1!, ssdModel2!];
      let storageIndex = 0;

      for (let mp of moboMPs) {
        if (!mp.attachedModel && storageModels[storageIndex]) {
          if (mp.attach(storageModels[storageIndex])) {
            storageIndex++;
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        if (storageIndex >= storageModels.length) break;
      }

      await increaseTo(100);
      setRerenderState(x => !x);
    })();
  }, [builder, isInitialized, onBaseModelChanged, setPrecent]);

  const isLoading = percent < 100;

  const forceMissionRefresh = useCallback(() => {
    refreshMissionState();
  }, []);

  return (
    <>
      {modalOpen && (
        <ModalOverlay>
          <ModalContent $isSuccess={modalSuccess}>
            <ModalTitle $isSuccess={modalSuccess}>
              {modalSuccess ? '🎉 Missão Concluída!' : '⚠️ Objetivos Pendentes'}
            </ModalTitle>
            <ModalText>{modalMessage}</ModalText>
            {modalSuccess ? (
              <ModalButton onClick={handleBackToHome}>
                Voltar para a tela inicial
              </ModalButton>
            ) : (
              <ModalButton
                onClick={() => setModalOpen(false)}
                style={{ background: '#475569' }}
              >
                Tentar Novamente
              </ModalButton>
            )}
          </ModalContent>
        </ModalOverlay>
      )}
      {!isLoading && (
        <GlobalMissionOverlay>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
            Análise e Diagnóstico ({missionState.solved}/
            {missionState.visibleItems.length})
          </div>

          {missionState.visibleItems.map(item => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13,
                lineHeight: 1.5,
                opacity: item.done ? 1 : 0.72,
                color: item.done ? '#86efac' : '#e2e8f0',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  flex: '0 0 10px',
                  background: item.done ? '#22c55e' : '#f59e0b',
                }}
              />
              <span>{item.label}</span>
            </div>
          ))}

          <div
            style={{
              width: '100%',
              height: 10,
              marginTop: 12,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${missionState.progress}%`,
                borderRadius: 999,
                background: 'linear-gradient(90deg, #f59e0b, #22c55e)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>

          <button
            onClick={handleFinishMission}
            style={{
              marginTop: 16,
              width: '100%',
              height: 42,
              border: 'none',
              borderRadius: 12,
              background: '#2563eb',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Finalizar missão
          </button>
        </GlobalMissionOverlay>
      )}

      <PCCProblemMissionRootDiv>
        {baseModel ? (
          <TreeViewRerenderContext.Provider value={forceMissionRefresh}>
            <PCCRuntimeContext.Provider value={builder?.runtime}>
              {selectedTarget === undefined ? (
                <PcComponentsListDiv>
                  <TreePCCView
                    model={baseModel}
                    onClickEmptyMountPoint={mountPoint =>
                      setSelectedTarget(mountPoint)
                    }
                  />
                </PcComponentsListDiv>
              ) : (
                <ComponentListPanel
                  onSelected={onComponentSelected}
                  target={selectedTarget}
                />
              )}
            </PCCRuntimeContext.Provider>
          </TreeViewRerenderContext.Provider>
        ) : null}

        <LoadingScreen isShowing={isLoading} />
      </PCCProblemMissionRootDiv>
    </>
  );
}
