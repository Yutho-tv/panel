import React, { useState } from 'react';
import { faBoxOpen, faCloudDownloadAlt, faEllipsisH, faLock, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import DropdownMenu, { DropdownButtonRow } from '@/components/elements/DropdownMenu';
import getBackupDownloadUrl from '@/api/server/backups/getBackupDownloadUrl';
import useFlash from '@/plugins/useFlash';
import ChecksumModal from '@/components/server/backups/ChecksumModal';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import deleteBackup from '@/api/server/backups/deleteBackup';
import ConfirmationModal from '@/components/elements/ConfirmationModal';
import Can from '@/components/elements/Can';
import tw from 'twin.macro';
import getServerBackups from '@/api/swr/getServerBackups';
import { ServerBackup } from '@/api/server/types';
import { ServerContext } from '@/state/server';
import Input from '@/components/elements/Input';

interface Props {
    backup: ServerBackup;
}

export default ({ backup }: Props) => {
    const uuid = ServerContext.useStoreState(state => state.server.data!.uuid);
    const [ loading, setLoading ] = useState(false);
    const [ visible, setVisible ] = useState(false);
    const [ deleteVisible, setDeleteVisible ] = useState(false);
    const [ restoreVisible, setRestoreVisible ] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { mutate } = getServerBackups();

    const doDownload = () => {
        setLoading(true);
        clearFlashes('backups');
        getBackupDownloadUrl(uuid, backup.uuid)
            .then(url => {
                // @ts-ignore
                window.location = url;
            })
            .catch(error => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
            })
            .then(() => setLoading(false));
    };

    const doDeletion = () => {
        setLoading(true);
        clearFlashes('backups');
        deleteBackup(uuid, backup.uuid)
            .then(() => {
                mutate(data => ({
                    ...data,
                    items: data.items.filter(b => b.uuid !== backup.uuid),
                }), false);
            })
            .catch(error => {
                console.error(error);
                clearAndAddHttpError({ key: 'backups', error });
                setLoading(false);
                setDeleteVisible(false);
            });
    };

    return (
        <>
            {visible &&
            <ChecksumModal
                appear
                visible={visible}
                onDismissed={() => setVisible(false)}
                checksum={backup.checksum}
            />
            }
            <ConfirmationModal
                visible={restoreVisible}
                title={'Restore this backup?'}
                buttonText={'Restore backup'}
                onConfirmed={() => null}
                onModalDismissed={() => setRestoreVisible(false)}
            >
                <p css={tw`text-neutral-300`}>
                    This server will be stopped in order to restore the backup. Once the backup has started you will
                    not be able to control the server power state, access the file manager, or create additional backups
                    until it has completed.
                </p>
                <p css={tw`text-neutral-300 mt-4`}>
                    Are you sure you want to continue?
                </p>
                <p css={tw`mt-4 -mb-2 bg-neutral-900 p-3 rounded`}>
                    <label htmlFor={'restore_truncate'} css={tw`text-base text-neutral-200 flex items-center cursor-pointer`}>
                        <Input
                            type={'checkbox'}
                            css={tw`text-red-500! w-5! h-5! mr-2`}
                            id={'restore_truncate'}
                            value={'true'}
                        />
                        Remove all files and folders before restoring this backup.
                    </label>
                </p>
            </ConfirmationModal>
            <ConfirmationModal
                visible={deleteVisible}
                title={'Delete this backup?'}
                buttonText={'Yes, delete backup'}
                onConfirmed={() => doDeletion()}
                onModalDismissed={() => setDeleteVisible(false)}
            >
                Are you sure you wish to delete this backup? This is a permanent operation and the backup cannot
                be recovered once deleted.
            </ConfirmationModal>
            <SpinnerOverlay visible={loading} fixed/>
            {backup.isSuccessful ?
                <DropdownMenu
                    renderToggle={onClick => (
                        <button
                            onClick={onClick}
                            css={tw`text-neutral-200 transition-colors duration-150 hover:text-neutral-100 p-2`}
                        >
                            <FontAwesomeIcon icon={faEllipsisH}/>
                        </button>
                    )}
                >
                    <div css={tw`text-sm`}>
                        <Can action={'backup.download'}>
                            <DropdownButtonRow onClick={() => doDownload()}>
                                <FontAwesomeIcon fixedWidth icon={faCloudDownloadAlt} css={tw`text-xs`}/>
                                <span css={tw`ml-2`}>Download</span>
                            </DropdownButtonRow>
                        </Can>
                        <Can action={'backup.restore'}>
                            <DropdownButtonRow onClick={() => setRestoreVisible(true)}>
                                <FontAwesomeIcon fixedWidth icon={faBoxOpen} css={tw`text-xs`}/>
                                <span css={tw`ml-2`}>Restore</span>
                            </DropdownButtonRow>
                        </Can>
                        <DropdownButtonRow onClick={() => setVisible(true)}>
                            <FontAwesomeIcon fixedWidth icon={faLock} css={tw`text-xs`}/>
                            <span css={tw`ml-2`}>Checksum</span>
                        </DropdownButtonRow>
                        <Can action={'backup.delete'}>
                            <DropdownButtonRow danger onClick={() => setDeleteVisible(true)}>
                                <FontAwesomeIcon fixedWidth icon={faTrashAlt} css={tw`text-xs`}/>
                                <span css={tw`ml-2`}>Delete</span>
                            </DropdownButtonRow>
                        </Can>
                    </div>
                </DropdownMenu>
                :
                <button
                    onClick={() => setDeleteVisible(true)}
                    css={tw`text-neutral-200 transition-colors duration-150 hover:text-neutral-100 p-2`}
                >
                    <FontAwesomeIcon icon={faTrashAlt}/>
                </button>
            }
        </>
    );
};
