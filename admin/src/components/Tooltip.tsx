import { Information } from '@strapi/icons';
import { Tooltip as StrapiTooltip }  from '@strapi/design-system';

export default function Tooltip({ description }: { description: string }) {
    return <StrapiTooltip description={description}>
        <Information aria-hidden="true"/>
    </StrapiTooltip>
}