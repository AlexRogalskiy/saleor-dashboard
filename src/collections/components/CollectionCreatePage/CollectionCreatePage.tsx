import { ChannelCollectionData } from "@saleor/channels/utils";
import { CardSpacer } from "@saleor/components/CardSpacer";
import ChannelsAvailabilityCard from "@saleor/components/ChannelsAvailabilityCard";
import { Container } from "@saleor/components/Container";
import Grid from "@saleor/components/Grid";
import Metadata from "@saleor/components/Metadata";
import PageHeader from "@saleor/components/PageHeader";
import Savebar from "@saleor/components/Savebar";
import SeoForm from "@saleor/components/SeoForm";
import {
  CollectionChannelListingErrorFragment,
  CollectionErrorFragment,
  PermissionEnum
} from "@saleor/graphql";
import { SubmitPromise } from "@saleor/hooks/useForm";
import { sectionNames } from "@saleor/intl";
import { Backlink, ConfirmButtonTransitionState } from "@saleor/macaw-ui";
import React from "react";
import { useIntl } from "react-intl";

import CollectionDetails from "../CollectionDetails/CollectionDetails";
import { CollectionImage } from "../CollectionImage/CollectionImage";
import CollectionCreateForm, { CollectionCreateData } from "./form";

export interface CollectionCreatePageProps {
  channelsCount: number;
  channelsErrors: CollectionChannelListingErrorFragment[];
  currentChannels: ChannelCollectionData[];
  disabled: boolean;
  errors: CollectionErrorFragment[];
  saveButtonBarState: ConfirmButtonTransitionState;
  onBack: () => void;
  onSubmit: (data: CollectionCreateData) => SubmitPromise;
  onChannelsChange: (data: ChannelCollectionData[]) => void;
  openChannelsModal: () => void;
}

const CollectionCreatePage: React.FC<CollectionCreatePageProps> = ({
  channelsCount,
  channelsErrors,
  currentChannels = [],
  disabled,
  errors,
  saveButtonBarState,
  onBack,
  onChannelsChange,
  openChannelsModal,
  onSubmit
}: CollectionCreatePageProps) => {
  const intl = useIntl();

  return (
    <CollectionCreateForm
      onSubmit={onSubmit}
      currentChannels={currentChannels}
      setChannels={onChannelsChange}
    >
      {({ change, data, handlers, hasChanged, submit }) => (
        <Container>
          <Backlink onClick={onBack}>
            {intl.formatMessage(sectionNames.collections)}
          </Backlink>
          <PageHeader
            title={intl.formatMessage({
              defaultMessage: "Add Collection",
              description: "page header"
            })}
          />
          <Grid>
            <div>
              <CollectionDetails
                data={data}
                disabled={disabled}
                errors={errors}
                onChange={change}
                onDescriptionChange={handlers.changeDescription}
              />
              <CardSpacer />
              <CollectionImage
                image={
                  data.backgroundImage.url
                    ? {
                        __typename: "Image",
                        alt: data.backgroundImageAlt,
                        url: data.backgroundImage.url
                      }
                    : null
                }
                onImageDelete={() =>
                  change({
                    target: {
                      name: "backgroundImage",
                      value: {
                        url: null,
                        value: null
                      }
                    }
                  } as any)
                }
                onImageUpload={file =>
                  change({
                    target: {
                      name: "backgroundImage",
                      value: {
                        url: URL.createObjectURL(file),
                        value: file
                      }
                    }
                  } as any)
                }
                onChange={change}
                data={data}
              />
              <CardSpacer />
              <SeoForm
                allowEmptySlug={true}
                description={data.seoDescription}
                disabled={disabled}
                descriptionPlaceholder=""
                helperText={intl.formatMessage({
                  defaultMessage:
                    "Add search engine title and description to make this collection easier to find"
                })}
                slug={data.slug}
                slugPlaceholder={data.name}
                title={data.seoTitle}
                titlePlaceholder={data.name}
                onChange={change}
              />
              <CardSpacer />
              <Metadata data={data} onChange={handlers.changeMetadata} />
            </div>
            <div>
              <ChannelsAvailabilityCard
                messages={{
                  hiddenLabel: intl.formatMessage({
                    defaultMessage: "Hidden",
                    description: "collection label"
                  }),

                  visibleLabel: intl.formatMessage({
                    defaultMessage: "Visible",
                    description: "collection label"
                  })
                }}
                managePermissions={[PermissionEnum.MANAGE_PRODUCTS]}
                errors={channelsErrors}
                selectedChannelsCount={data.channelListings.length}
                allChannelsCount={channelsCount}
                channels={data.channelListings}
                disabled={disabled}
                onChange={handlers.changeChannels}
                openModal={openChannelsModal}
              />
            </div>
          </Grid>
          <Savebar
            state={saveButtonBarState}
            disabled={disabled || !hasChanged}
            onCancel={onBack}
            onSubmit={submit}
          />
        </Container>
      )}
    </CollectionCreateForm>
  );
};
CollectionCreatePage.displayName = "CollectionCreatePage";
export default CollectionCreatePage;
