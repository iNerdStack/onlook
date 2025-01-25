import { useEditorEngine } from '@/components/Context';
import type { LayerNode } from '@onlook/models/element';
import type { PageNode } from '@onlook/models/pages';
import { observer } from 'mobx-react-lite';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type NodeApi, Tree, type TreeApi } from 'react-arborist';
import useResizeObserver from 'use-resize-observer';
import RightClickMenu from '../RightClickMenu';
import TreeNode from './Tree/TreeNode';
import TreeRow from './Tree/TreeRow';
import { Tabs, TabsList, TabsTrigger } from '@onlook/ui/tabs';
import { Icons } from '@onlook/ui/icons';
import PageTreeNode from './Tree/PageTreeNode';
import PageTreeRow from './Tree/PageTreeRow';

const LayersTab = observer(() => {
    const treeRef = useRef<TreeApi<LayerNode>>();
    const editorEngine = useEditorEngine();
    const [treeHovered, setTreeHovered] = useState(false);
    const { ref, width, height } = useResizeObserver();
    const [activeTab, setActiveTab] = useState<'pages' | 'elements'>('pages');

    useEffect(handleSelectChange, [
        editorEngine.elements.selected,
        editorEngine.ast.mappings.layers,
    ]);

    useEffect(() => {
        console.log('Layertab Scanning pages...');
        editorEngine.pages.scanPages();
    }, []);

    useEffect(() => {
        console.log('Pages tree updated:', editorEngine.pages.tree);
    }, [editorEngine.pages.tree]);

    const handleMouseLeaveTree = useCallback(() => {
        setTreeHovered(false);
        editorEngine.overlay.state.updateHoverRect(null);
    }, [editorEngine.overlay.state]);

    function handleSelectChange() {
        if (editorEngine.elements.selected.length > 0) {
            treeRef.current?.scrollTo(editorEngine.elements.selected[0].domId);
        }
    }

    const handleDragEnd = useCallback(
        async ({
            dragNodes,
            parentNode,
            index,
        }: {
            dragNodes: NodeApi<LayerNode>[];
            parentNode: NodeApi<LayerNode> | null;
            index: number;
        }) => {
            if (!parentNode) {
                console.error('No parent found');
                return;
            }
            if (dragNodes.length !== 1) {
                console.error('Only one element can be dragged at a time');
                return;
            }
            const dragNode = dragNodes[0];
            const webview = editorEngine.webviews.getWebview(dragNode.data.webviewId);

            if (!webview) {
                console.error('No webview found');
                return;
            }

            const originalIndex: number | undefined = (await webview.executeJavaScript(
                `window.api?.getElementIndex('${dragNode.data.domId}')`,
            )) as number | undefined;

            if (originalIndex === undefined) {
                console.error('No original index found');
                return;
            }

            const childEl = await webview.executeJavaScript(
                `window.api?.getDomElementByDomId('${dragNode.data.domId}')`,
            );
            if (!childEl) {
                console.error('Failed to get element');
                return;
            }
            const parentEl = await webview.executeJavaScript(
                `window.api?.getDomElementByDomId('${parentNode.data.domId}')`,
            );
            if (!parentEl) {
                console.error('Failed to get parent element');
                return;
            }

            const newIndex = index > originalIndex ? index - 1 : index;

            if (newIndex === originalIndex) {
                console.log('No index change');
                return;
            }

            const moveAction = editorEngine.move.createMoveAction(
                webview.id,
                childEl,
                parentEl,
                newIndex,
                originalIndex,
            );
            editorEngine.action.run(moveAction);
        },
        [editorEngine],
    );

    const disableDrop = useCallback(
        ({
            parentNode,
            dragNodes,
        }: {
            parentNode: NodeApi<LayerNode> | null;
            dragNodes: NodeApi<LayerNode>[];
        }) => {
            return !dragNodes.every((node) => node?.parent?.id === parentNode?.id);
        },
        [],
    );

    const childrenAccessor = useCallback(
        (node: LayerNode) => {
            const children = node.children
                ?.map((child) => editorEngine.ast.mappings.getLayerNode(node.webviewId, child))
                .filter((child) => child !== undefined) as LayerNode[];
            return children?.length ? children : null;
        },
        [editorEngine.ast.mappings],
    );

    const dimensions = useMemo(
        () => ({
            height: (height ?? 8) - 16,
            width: width ?? 365,
        }),
        [height, width],
    );

    const pageTreeProps = useMemo(
        () => ({
            data: editorEngine.pages.tree,
            idAccessor: (node: PageNode) => node.path,
            childrenAccessor: (node: PageNode) => node.children ?? null,
            onSelect: (nodes: NodeApi<PageNode>[]) => {
                if (nodes.length > 0) {
                    console.log('Selected page node:', nodes[0].data);
                    editorEngine.pages.navigateTo(nodes[0].data.path);
                }
            },
            height: dimensions.height,
            width: dimensions.width,
            indent: 8,
            rowHeight: 24,
            renderRow: PageTreeRow,
        }),
        [
            editorEngine.pages.tree,
            editorEngine.pages.navigateTo,
            dimensions.height,
            dimensions.width,
        ],
    );

    const elementTreeProps = useMemo(
        () => ({
            ref: treeRef,
            data: editorEngine.ast.mappings.layers,
            idAccessor: (node: LayerNode) => node.domId,
            childrenAccessor,
            onMove: handleDragEnd,
            disableDrop,
            openByDefault: true,
            overscanCount: 1,
            height: dimensions.height,
            width: dimensions.width,
            indent: 8,
            padding: 0,
            rowHeight: 24,
            renderRow: TreeRow,
        }),
        [
            childrenAccessor,
            handleDragEnd,
            disableDrop,
            dimensions.height,
            dimensions.width,
            editorEngine.ast.mappings.layers,
        ],
    );

    return (
        <div ref={ref} className="flex flex-col h-[calc(100vh-8.25rem)] text-xs text-active w-full">
            <Tabs
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as 'pages' | 'elements')}
            >
                <TabsList>
                    <TabsTrigger value="pages">
                        <Icons.Directory className="w-4 h-4 mr-2" />
                        Pages
                    </TabsTrigger>
                    <TabsTrigger value="elements">
                        <Icons.Layers className="w-4 h-4 mr-2" />
                        Elements
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <div
                className="flex-1 overflow-auto"
                onMouseOver={() => setTreeHovered(true)}
                onMouseLeave={handleMouseLeaveTree}
            >
                <RightClickMenu>
                    {activeTab === 'pages' ? (
                        <Tree<PageNode> {...pageTreeProps}>
                            {(props) => <PageTreeNode {...props} />}
                        </Tree>
                    ) : (
                        <Tree<LayerNode> {...elementTreeProps}>
                            {(props) => <TreeNode {...props} treeHovered={treeHovered} />}
                        </Tree>
                    )}
                </RightClickMenu>
            </div>
        </div>
    );
});

export default memo(LayersTab);
