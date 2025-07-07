import { Information } from '@strapi/icons';
import { Tooltip as StrapiTooltip, Box }  from '@strapi/design-system';

export default function Tooltip({ description }: { description: string }) {
    return <Box paddingLeft={1} paddingRight={1}>
        <StrapiTooltip description={description}>
            <Information aria-hidden="true"/>
        </StrapiTooltip>
    </Box>
}