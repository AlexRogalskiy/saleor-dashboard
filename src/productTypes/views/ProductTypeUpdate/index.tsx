import { attributeUrl } from "@saleor/attributes/urls";
import AssignAttributeDialog from "@saleor/components/AssignAttributeDialog";
import AttributeUnassignDialog from "@saleor/components/AttributeUnassignDialog";
import BulkAttributeUnassignDialog from "@saleor/components/BulkAttributeUnassignDialog";
import NotFoundPage from "@saleor/components/NotFoundPage";
import TypeDeleteWarningDialog from "@saleor/components/TypeDeleteWarningDialog";
import { WindowTitle } from "@saleor/components/WindowTitle";
import { DEFAULT_INITIAL_SEARCH_DATA } from "@saleor/config";
import {
  AssignProductAttributeMutation,
  ProductAttributeType,
  ProductTypeDeleteMutation,
  UnassignProductAttributeMutation,
  useProductAttributeAssignmentUpdateMutation,
  useProductTypeDetailsQuery,
  useProductTypeUpdateMutation,
  useUpdateMetadataMutation,
  useUpdatePrivateMetadataMutation
} from "@saleor/graphql";
import useBulkActions from "@saleor/hooks/useBulkActions";
import useNavigator from "@saleor/hooks/useNavigator";
import useNotifier from "@saleor/hooks/useNotifier";
import { commonMessages } from "@saleor/intl";
import { Button } from "@saleor/macaw-ui";
import { getStringOrPlaceholder, maybe } from "@saleor/misc";
import useProductTypeDelete from "@saleor/productTypes/hooks/useProductTypeDelete";
import useProductTypeOperations from "@saleor/productTypes/hooks/useProductTypeOperations";
import useAvailableProductAttributeSearch from "@saleor/searches/useAvailableProductAttributeSearch";
import { ReorderEvent } from "@saleor/types";
import createMetadataUpdateHandler from "@saleor/utils/handlers/metadataUpdateHandler";
import { mapEdgesToItems } from "@saleor/utils/maps";
import React from "react";
import { FormattedMessage, useIntl } from "react-intl";

import ProductTypeDetailsPage, {
  ProductTypeForm
} from "../../components/ProductTypeDetailsPage";
import {
  productTypeListUrl,
  productTypeUrl,
  ProductTypeUrlQueryParams
} from "../../urls";

interface ProductTypeUpdateProps {
  id: string;
  params: ProductTypeUrlQueryParams;
}

export const ProductTypeUpdate: React.FC<ProductTypeUpdateProps> = ({
  id,
  params
}) => {
  const navigate = useNavigator();
  const notify = useNotifier();
  const productAttributeListActions = useBulkActions();
  const variantAttributeListActions = useBulkActions();
  const intl = useIntl();
  const { loadMore, search, result } = useAvailableProductAttributeSearch({
    variables: {
      ...DEFAULT_INITIAL_SEARCH_DATA,
      id
    }
  });
  const [errors, setErrors] = React.useState({
    addAttributeErrors: [],
    editAttributeErrors: [],
    formErrors: []
  });

  const [
    updateProductType,
    updateProductTypeOpts
  ] = useProductTypeUpdateMutation({
    onCompleted: updateData => {
      if (
        !updateData.productTypeUpdate.errors ||
        updateData.productTypeUpdate.errors.length === 0
      ) {
        notify({
          status: "success",
          text: intl.formatMessage(commonMessages.savedChanges)
        });
      } else if (
        updateData.productTypeUpdate.errors !== null &&
        updateData.productTypeUpdate.errors.length > 0
      ) {
        setErrors(prevErrors => ({
          ...prevErrors,
          formErrors: updateData.productTypeUpdate.errors
        }));
      }
    }
  });
  const [
    updateProductAttributes,
    updateProductAttributesOpts
  ] = useProductAttributeAssignmentUpdateMutation({
    onCompleted: updateData => {
      if (
        updateData.productAttributeAssignmentUpdate.errors !== null &&
        updateData.productAttributeAssignmentUpdate.errors.length > 0
      ) {
        setErrors(prevErrors => ({
          ...prevErrors,
          formErrors: updateData.productAttributeAssignmentUpdate.errors
        }));
      }
    }
  });

  const [updateMetadata] = useUpdateMetadataMutation({});
  const [updatePrivateMetadata] = useUpdatePrivateMetadataMutation({});

  const handleBack = () => navigate(productTypeListUrl());
  const [
    selectedVariantAttributes,
    setSelectedVariantAttributes
  ] = React.useState<string[]>([]);

  const handleProductTypeUpdate = async (formData: ProductTypeForm) => {
    const operations = formData.variantAttributes.map(variantAttribute => ({
      id: variantAttribute.value,
      variantSelection: selectedVariantAttributes.includes(
        variantAttribute.value
      )
    }));

    const productAttributeUpdateResult = await updateProductAttributes({
      variables: {
        productTypeId: id,
        operations
      }
    });

    const result = await updateProductType({
      variables: {
        id,
        input: {
          hasVariants: formData.hasVariants,
          isShippingRequired: formData.isShippingRequired,
          name: formData.name,
          kind: formData.kind,
          productAttributes: formData.productAttributes.map(
            choice => choice.value
          ),
          taxCode: formData.taxType,
          variantAttributes: formData.variantAttributes.map(
            choice => choice.value
          ),
          weight: formData.weight
        }
      }
    });

    return [
      ...result.data.productTypeUpdate.errors,
      ...productAttributeUpdateResult.data.productAttributeAssignmentUpdate
        .errors
    ];
  };

  const productTypeDeleteData = useProductTypeDelete({
    singleId: id,
    params
  });

  const { data, loading: dataLoading } = useProductTypeDetailsQuery({
    displayLoader: true,
    variables: { id }
  });

  const productType = data?.productType;

  const closeModal = () => navigate(productTypeUrl(id), { replace: true });

  const handleAttributeAssignSuccess = (
    data: AssignProductAttributeMutation
  ) => {
    if (data.productAttributeAssign.errors.length === 0) {
      notify({
        status: "success",
        text: intl.formatMessage(commonMessages.savedChanges)
      });
      closeModal();
    } else if (
      data.productAttributeAssign.errors !== null &&
      data.productAttributeAssign.errors.length > 0
    ) {
      setErrors(prevErrors => ({
        ...prevErrors,
        addAttributeErrors: data.productAttributeAssign.errors
      }));
    }
  };
  const handleAttributeUnassignSuccess = (
    data: UnassignProductAttributeMutation
  ) => {
    if (data.productAttributeUnassign.errors.length === 0) {
      notify({
        status: "success",
        text: intl.formatMessage(commonMessages.savedChanges)
      });
      closeModal();
      productAttributeListActions.reset();
      variantAttributeListActions.reset();
    }
  };
  const handleProductTypeDeleteSuccess = (
    deleteData: ProductTypeDeleteMutation
  ) => {
    if (deleteData.productTypeDelete.errors.length === 0) {
      notify({
        status: "success",
        text: intl.formatMessage({
          defaultMessage: "Product type deleted"
        })
      });
      navigate(productTypeListUrl(), { replace: true });
    }
  };

  const {
    assignAttribute,
    deleteProductType,
    unassignAttribute,
    reorderAttribute
  } = useProductTypeOperations({
    onAssignAttribute: handleAttributeAssignSuccess,
    onProductTypeAttributeReorder: () => undefined,
    onProductTypeDelete: handleProductTypeDeleteSuccess,
    onUnassignAttribute: handleAttributeUnassignSuccess,
    productType: data?.productType
  });

  const handleSubmit = createMetadataUpdateHandler(
    data?.productType,
    handleProductTypeUpdate,
    variables => updateMetadata({ variables }),
    variables => updatePrivateMetadata({ variables })
  );

  const handleProductTypeDelete = () => deleteProductType.mutate({ id });
  const handleProductTypeVariantsToggle = (hasVariants: boolean) =>
    updateProductType({
      variables: {
        id,
        input: {
          hasVariants
        }
      }
    });
  const handleAssignAttribute = () =>
    assignAttribute.mutate({
      id,
      operations: params.ids.map(id => ({
        id,
        type: ProductAttributeType[params.type]
      }))
    });

  const handleAttributeUnassign = () =>
    unassignAttribute.mutate({
      id,
      ids: [params.id]
    });

  const handleBulkAttributeUnassign = () =>
    unassignAttribute.mutate({
      id,
      ids: params.ids
    });

  const loading =
    updateProductTypeOpts.loading ||
    updateProductAttributesOpts.loading ||
    dataLoading;

  const handleAttributeReorder = (
    event: ReorderEvent,
    type: ProductAttributeType
  ) => {
    const attributes =
      type === ProductAttributeType.PRODUCT
        ? data.productType.productAttributes
        : data.productType.variantAttributes;

    reorderAttribute.mutate({
      move: {
        id: attributes[event.oldIndex].id,
        sortOrder: event.newIndex - event.oldIndex
      },
      productTypeId: id,
      type
    });
  };

  if (productType === null) {
    return <NotFoundPage onBack={handleBack} />;
  }

  return (
    <>
      <WindowTitle title={maybe(() => data.productType.name)} />
      <ProductTypeDetailsPage
        defaultWeightUnit={maybe(() => data.shop.defaultWeightUnit)}
        disabled={loading}
        errors={errors.formErrors}
        pageTitle={maybe(() => data.productType.name)}
        productType={maybe(() => data.productType)}
        saveButtonBarState={
          updateProductTypeOpts.status || updateProductAttributesOpts.status
        }
        taxTypes={maybe(() => data.taxTypes, [])}
        selectedVariantAttributes={selectedVariantAttributes}
        setSelectedVariantAttributes={setSelectedVariantAttributes}
        onAttributeAdd={type =>
          navigate(
            productTypeUrl(id, {
              action: "assign-attribute",
              type
            })
          )
        }
        onAttributeClick={attributeId => navigate(attributeUrl(attributeId))}
        onAttributeReorder={handleAttributeReorder}
        onAttributeUnassign={attributeId =>
          navigate(
            productTypeUrl(id, {
              action: "unassign-attribute",
              id: attributeId
            })
          )
        }
        onBack={handleBack}
        onDelete={() =>
          navigate(
            productTypeUrl(id, {
              action: "remove"
            })
          )
        }
        onHasVariantsToggle={handleProductTypeVariantsToggle}
        onSubmit={handleSubmit}
        productAttributeList={{
          isChecked: productAttributeListActions.isSelected,
          selected: productAttributeListActions.listElements.length,
          toggle: productAttributeListActions.toggle,
          toggleAll: productAttributeListActions.toggleAll,
          toolbar: (
            <Button
              onClick={() =>
                navigate(
                  productTypeUrl(id, {
                    action: "unassign-attributes",
                    ids: productAttributeListActions.listElements
                  })
                )
              }
            >
              <FormattedMessage
                defaultMessage="Unassign"
                description="unassign attribute from product type, button"
              />
            </Button>
          )
        }}
        variantAttributeList={{
          isChecked: variantAttributeListActions.isSelected,
          selected: variantAttributeListActions.listElements.length,
          toggle: variantAttributeListActions.toggle,
          toggleAll: variantAttributeListActions.toggleAll,
          toolbar: (
            <Button
              onClick={() =>
                navigate(
                  productTypeUrl(id, {
                    action: "unassign-attributes",
                    ids: variantAttributeListActions.listElements
                  })
                )
              }
            >
              <FormattedMessage
                defaultMessage="Unassign"
                description="unassign attribute from product type, button"
              />
            </Button>
          )
        }}
      />
      {!dataLoading && (
        <>
          {Object.keys(ProductAttributeType).map(key => (
            <AssignAttributeDialog
              attributes={mapEdgesToItems(
                result?.data?.productType?.availableAttributes
              )}
              confirmButtonState={assignAttribute.opts.status}
              errors={maybe(
                () =>
                  assignAttribute.opts.data.productAttributeAssign.errors.map(
                    err => err.message
                  ),
                []
              )}
              loading={result.loading}
              onClose={closeModal}
              onSubmit={handleAssignAttribute}
              onFetch={search}
              onFetchMore={loadMore}
              onOpen={result.refetch}
              hasMore={maybe(
                () =>
                  result.data.productType.availableAttributes.pageInfo
                    .hasNextPage,
                false
              )}
              open={
                params.action === "assign-attribute" &&
                params.type === ProductAttributeType[key]
              }
              selected={maybe(() => params.ids, [])}
              onToggle={attributeId => {
                const ids = maybe(() => params.ids, []);
                navigate(
                  productTypeUrl(id, {
                    ...params,
                    ids: ids.includes(attributeId)
                      ? params.ids.filter(
                          selectedId => selectedId !== attributeId
                        )
                      : [...ids, attributeId]
                  })
                );
              }}
              key={key}
            />
          ))}
          {productType && (
            <TypeDeleteWarningDialog
              {...productTypeDeleteData}
              typesData={[productType]}
              typesToDelete={[id]}
              onClose={closeModal}
              onDelete={handleProductTypeDelete}
              deleteButtonState={deleteProductType.opts.status}
            />
          )}
        </>
      )}

      <BulkAttributeUnassignDialog
        title={intl.formatMessage({
          defaultMessage: "Unassign Attribute from Product Type",
          description: "dialog header"
        })}
        attributeQuantity={maybe(() => params.ids.length)}
        confirmButtonState={unassignAttribute.opts.status}
        onClose={closeModal}
        onConfirm={handleBulkAttributeUnassign}
        open={params.action === "unassign-attributes"}
        itemTypeName={getStringOrPlaceholder(data?.productType.name)}
      />
      <AttributeUnassignDialog
        title={intl.formatMessage({
          defaultMessage: "Unassign Attribute From Product Type",
          description: "dialog header"
        })}
        attributeName={maybe(
          () =>
            [
              ...data.productType.productAttributes,
              ...data.productType.variantAttributes
            ].find(attribute => attribute.id === params.id).name,
          "..."
        )}
        confirmButtonState={unassignAttribute.opts.status}
        onClose={closeModal}
        onConfirm={handleAttributeUnassign}
        open={params.action === "unassign-attribute"}
        itemTypeName={getStringOrPlaceholder(data?.productType.name)}
      />
    </>
  );
};
export default ProductTypeUpdate;
