import { useEditorEngine } from '@/components/store/editor';
import { EditorTabValue } from '@onlook/models';
import { Button } from '@onlook/ui/button';
import { Icons } from '@onlook/ui/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@onlook/ui/tooltip';
import { TooltipArrow } from '@radix-ui/react-tooltip';
import { observer } from 'mobx-react-lite';

export const DevControls = observer(() => {
    const editorEngine = useEditorEngine();

    const handleClose = () => {
        editorEngine.state.rightPanelTab = EditorTabValue.CHAT;
    };

    return (
        <div className="flex flex-row opacity-50 transition-opacity duration-200 group-hover/panel:opacity-100">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={'ghost'}
                        size={'icon'}
                        className="p-2 w-fit h-fit hover:bg-background-onlook cursor-pointer"
                        onClick={handleClose}
                    >
                        <Icons.CrossS className='h-4 w-4' />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <p>Close</p>
                    <TooltipArrow className="fill-foreground" />
                </TooltipContent>
            </Tooltip>
        </div>
    );
}); 