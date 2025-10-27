
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Information } from '@strapi/icons';
import { Box, Typography }  from '@strapi/design-system';

// Since there occurs an error with the Strapi design system Tooltip component,
// we use the Radix Tooltip component directly here.
// see https://github.com/strapi/strapi/issues/21823

export default function Tooltip({ description }: { description: string }) {
    return (
        <RadixTooltip.Provider>
            <RadixTooltip.Root>
                <RadixTooltip.Trigger asChild>
                    <Information aria-hidden="true"/>
                </RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content sideOffset={5}>
                        <Box padding={2} margin={2} background="neutral1000"
                            hasRadius
                            shadow="filterShadow">
                            <Typography textColor="neutral0">
                                {description}
                            </Typography>
                        </Box>
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    )
}

